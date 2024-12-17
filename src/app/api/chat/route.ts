import { getGroqResponse } from "@/app/utils/groq";
import { scrapeAndCrawl } from "@/app/utils/scraper";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, url } = await request.json();
    let context = "";
    let links: Array<{ url: string }> = [];

    if (url) {
      try {
        const scrapedContent = await scrapeAndCrawl(url);
        links = scrapedContent.mainContent.links;

        context = `
          Main Content:
          ${scrapedContent.mainContent.markdown}
        `;
      } catch (error) {
        console.error("Error scraping content:", error);
      }
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
