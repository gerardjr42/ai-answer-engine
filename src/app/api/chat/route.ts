import FirecrawlApp from "@mendable/firecrawl-js";
import { Redis } from "@upstash/redis";
import * as cheerio from "cheerio";
import { Groq } from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import TurndownService from "turndown";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const turndownService = new TurndownService();

async function scrapeAndCrawl(url: string) {
  // Check cache first
  const cacheKey = `scraped_content:${url}`;
  const cachedContent = await redis.get<{
    mainContent: {
      markdown: string;
      links: Array<{ url: string }>;
    };
  }>(cacheKey);

  if (cachedContent) {
    console.log("Cache hit for URL:", url);
    return cachedContent;
  }

  console.log("Cache miss for URL:", url);
  const scrapeResult = await firecrawl.scrapeUrl(url, {
    formats: ["html"], // Only request HTML format
  });

  if (!scrapeResult.success) {
    throw new Error(`Failed to scrape: ${scrapeResult.error}`);
  }

  // Load HTML with Cheerio
  const $ = cheerio.load(scrapeResult.html || "");

  // Try to find main content in <main> or <article> tags
  let contentHtml = $("main").html() || $("article").html();

  if (!contentHtml) {
    // Fallback to body if no main/article found
    contentHtml = $("body").html() || "";
    console.log("No <main> or <article> tags found, using body content");
  }

  // Extract links from the main content area
  const links: Array<{ url: string }> = [];
  $(contentHtml)
    .find("a")
    .each((_, element) => {
      const href = $(element).attr("href");
      if (href && href.startsWith("http")) {
        try {
          new URL(href);
          const linkText = $(element).text().toLowerCase();

          // Reuse existing link filtering logic
          if (
            !linkText.includes("skip to") &&
            !linkText.includes("view image") &&
            !linkText.includes("reuse") &&
            !linkText.includes("subscribe") &&
            !linkText.includes("sign up") &&
            !linkText.includes("rateplan") &&
            !linkText.includes("follow us") &&
            !linkText.includes("support us") &&
            !linkText.includes("become a member") &&
            !linkText.includes("newsletter") &&
            !linkText.includes("subscription") &&
            !linkText.includes("donate") &&
            !href.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) &&
            !href.includes("/images/") &&
            !href.includes("/img/") &&
            !href.includes("/image/") &&
            !href.includes("/subscribe/") &&
            !href.includes("/membership/") &&
            !href.includes("/support/") &&
            !href.includes("/newsletter/") &&
            !href.includes("ratePlan")
          ) {
            links.push({ url: href });
          }
        } catch {
          // Invalid URL, skip
        }
      }
    });

  // Convert HTML to Markdown
  const markdown = turndownService.turndown(contentHtml);

  const result = {
    mainContent: {
      markdown,
      links,
    },
  };

  // Cache the result for 24 hours
  await redis.set(cacheKey, result, { ex: 86400 });

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { message, url } = await request.json();
    let context = "";
    let links: Array<{ url: string }> = [];

    if (url) {
      const scrapedContent = await scrapeAndCrawl(url);
      links = scrapedContent.mainContent.links;
      const footnotes = links
        .map((link, index) => `[${index + 1}] ${link.url}`)
        .join("\n");

      context = `
        Main Content:
        ${scrapedContent.mainContent.markdown}

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
