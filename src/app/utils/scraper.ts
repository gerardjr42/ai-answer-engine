import redis from "@/app/utils/redis";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import TurndownService from "turndown";

const turndownService = new TurndownService();

export async function scrapeAndCrawl(url: string) {
  try {
    new URL(url); // Check if the URL is valid
  } catch {
    throw new Error("Invalid URL provided");
  }

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
      "section",
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
      // Stop if we already have 5 links
      if (linkSet.size >= 5) return false;

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
