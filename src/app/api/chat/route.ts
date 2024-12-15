import { getGroqResponse } from "@/app/utils/groq";
import { Redis } from "@upstash/redis";
import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import TurndownService from "turndown";

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

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set timeout for navigation
    await page.setDefaultNavigationTimeout(40000);

    // Wait until network is idle to ensure content is loaded
    await page.goto(url, { waitUntil: "networkidle0" });

    // Selectors to wait for
    await Promise.race([
      page.waitForSelector("main"),
      page.waitForSelector("article"),
      page.waitForSelector('[role="main"]'),
      page.waitForSelector(".article-body"),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);

    // Get full HTML after JavaScript execution
    const html = await page.content();

    const $ = cheerio.load(html);

    const selectors = [
      "main",
      "article",
      '[role="main"]',
      ".article-body",
      "#article-body",
      ".story-body",
      ".content-body",
      ".article-content",
      '[data-testid="article-body"]',
      ".post-content",
      ".entry-content",
      "#content-body",
    ];

    let contentHtml = "";
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        console.log(`Found content using selector: ${selector}`);
        contentHtml = element.html() || "";
        break;
      }
    }

    if (!contentHtml) {
      console.log(
        "No content found with primary selectors, falling back to body"
      );
      contentHtml = $("body").html() || "";
    }

    const $content = cheerio.load(contentHtml);

    const removeSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      '[role="complementary"]',
      '[role="navigation"]',
      '[role="banner"]',
      ".ad",
      ".advertisement",
      ".social-share",
      ".newsletter-signup",
      ".related-articles",
      ".sidebar",
      "#sidebar",
      ".comments",
      ".comment-section",
    ];

    removeSelectors.forEach(selector => {
      $content(selector).remove();
    });

    contentHtml = $content.html() || "";

    // Verify we have meaningful content
    if (contentHtml.length < 100) {
      throw new Error("Could not extract meaningful content from the page");
    }

    // Replace the links array with a Set
    const linkSet = new Set<string>();

    // Modify the link extraction section
    $content("a").each((_, element) => {
      const href = $(element).attr("href");
      if (href && href.startsWith("http")) {
        try {
          new URL(href);
          const linkText = $(element).text().toLowerCase();

          // Filter out unwanted links
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
            linkSet.add(href);
          }
        } catch {
          console.error("Invalid URL:", href);
        }
      }
    });

    // Convert HTML to Markdown
    const markdown = turndownService.turndown(contentHtml);

    const result = {
      mainContent: {
        markdown,
        links: Array.from(linkSet).map(url => ({ url })),
      },
    };

    // Cache for 24 hours
    await redis.set(cacheKey, result, { ex: 86400 });

    return result;
  } finally {
    await browser.close();
  }
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

    const response = await getGroqResponse(message, context);

    return NextResponse.json({
      message: response,
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
