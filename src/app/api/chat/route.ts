// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer

import * as cheerio from "cheerio";
import { Groq } from "groq-sdk";
import puppeteer from "puppeteer";

const client = new Groq({
  apiKey: process.env["GROQ_API_KEY"],
});

async function scrapeWebpage(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  //remove script tags and unneeded elements
  $("script").remove();
  $("style").remove();
  return $(`body`).text().trim();
}
