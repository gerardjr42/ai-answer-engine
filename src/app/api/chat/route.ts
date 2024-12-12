import FirecrawlApp from "@mendable/firecrawl-js";
import { Groq } from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

async function scrapeAndCrawl(url: string) {
  const scrapeResult = await firecrawl.scrapeUrl(url, {
    formats: ["markdown", "html"],
  });

  if (!scrapeResult.success) {
    throw new Error(`Failed to scrape: ${scrapeResult.error}`);
  }

  console.log("Scrape Result:", {
    success: scrapeResult.success,
    markdown: scrapeResult.markdown,
    html: scrapeResult.html,
    metadata: scrapeResult.metadata,
  });

  return {
    mainContent: {
      markdown: scrapeResult.markdown,
      html: scrapeResult.html,
      metadata: scrapeResult.metadata,
    },
  };
}

function extractLinks(markdown: string): Array<{ url: string }> {
  // Find the first heading (usually the title)
  const firstHeadingMatch = markdown.match(/^#+ .+$/m);
  if (!firstHeadingMatch) return [];

  const startIndex = markdown.indexOf(firstHeadingMatch[0]);

  // Common end markers that indicate the end of main content
  const endMarkers = [
    "## Most viewed",
    "## Related",
    "## Comments",
    "Share this article",
    "Share on social media",
    "Follow us",
    "Subscribe",
    "Support us",
    "Become a member",
    "Sign up for our",
    "Newsletter",
    "Read more about",
    "More from",
    "More stories",
    "You might also like",
  ];

  let endIndex = markdown.length;
  for (const marker of endMarkers) {
    const markerIndex = markdown.indexOf(marker);
    if (markerIndex !== -1 && markerIndex < endIndex) {
      endIndex = markerIndex;
    }
  }

  const mainContent = markdown.slice(startIndex, endIndex);
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ url: string }> = [];
  let match;

  while ((match = linkRegex.exec(mainContent)) !== null) {
    const text = match[1].trim();
    const url = match[2].trim();

    try {
      new URL(url);
      if (
        !text.toLowerCase().includes("skip to") &&
        !text.toLowerCase().includes("view image") &&
        !text.toLowerCase().includes("reuse") &&
        !text.toLowerCase().includes("subscribe") &&
        !text.toLowerCase().includes("sign up") &&
        !text.toLowerCase().includes("rateplan") &&
        !text.toLowerCase().includes("follow us") &&
        !text.toLowerCase().includes("support us") &&
        !text.toLowerCase().includes("become a member") &&
        !text.toLowerCase().includes("newsletter") &&
        !text.toLowerCase().includes("subscription") &&
        !text.toLowerCase().includes("donate") &&
        url.startsWith("http") &&
        !url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) &&
        !url.includes("/images/") &&
        !url.includes("/img/") &&
        !url.includes("/image/") &&
        !url.includes("/subscribe/") &&
        !url.includes("/membership/") &&
        !url.includes("/support/") &&
        !url.includes("/newsletter/")
      ) {
        links.push({ url });
      }
    } catch {
      continue;
    }
  }

  return links;
}

export async function POST(request: NextRequest) {
  try {
    const { message, url } = await request.json();
    let context = "";
    let links: Array<{ url: string }> = [];

    if (url) {
      const scrapedContent = await scrapeAndCrawl(url);
      links = extractLinks(scrapedContent.mainContent.markdown || "");
      const footnotes = links
        .map((link, index) => `[${index + 1}] ${link.url}`)
        .join("\n");

      context = `
        Main Content:
        ${scrapedContent.mainContent.markdown || scrapedContent.mainContent.html}

        References:
        ${footnotes}
      `;
    }

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant that answers questions based on the provided context. When referencing information, use footnote numbers [1] to cite sources. The footnotes are provided at the end of the context. If no context is provided, you'll answer based on your general knowledge.",
        },
        {
          role: "user",
          content: context
            ? `Context: ${context}\n\nQuestion: ${message}`
            : message,
        },
      ],
    });

    return NextResponse.json({
      message:
        completion.choices[0].message.content ||
        "Sorry, I couldn't generate a response.",
      references: links.map((link, index) => `[${index + 1}] ${link.url}`),
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again later." },
      { status: 500 }
    );
  }
}
