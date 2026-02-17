import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";
import { addDays, format } from "date-fns";

const url = "https://www.vikingcruises.com/oceans/search-cruises/index.html";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrape_viking_cruises() {
    const outputFile = "./data.json";

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
    );

    console.log("🚀 Opening Viking Cruises...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    await delay(6000);

    const html = await page.content();
    await browser.close();

    console.log("✅ HTML loaded, now parsing...");

    const $ = cheerio.load(html);
    const newCruises = [];

    $(".cruise-detail-wrapper").each((i, el) => {
        const cruise = $(el);

        let directionText = cruise.find(".caption-info").first().text().trim();
        directionText = directionText.replace(/\(.*?\)/g, "");
        directionText = directionText.split("|")[0];

        const title = directionText.replace(/\s+/g, " ").trim();

        const durationDays = cruise.find(".item span.value").first().text().trim();
        const duration = durationDays ? `${durationDays} DAYS` : null;

        const price = cruise.find(".col4 .value").first().text().trim() || null;

        const relativeLink = cruise.find(".cruise-link").first().attr("href");
        const link = relativeLink
            ? `https://www.vikingcruises.com${relativeLink}`
            : null;

        const image = cruise.find(".cruise-images img").attr("src") || null;

        newCruises.push({
            title: title || null,
            ship: [],
            startDate: null,
            endDate: null,
            duration,
            price,
            link,
            image,
            provider: "VIKING_CRUISES",
            objectId: null
        });
    });

    ////////////////////////////////////////////////////////////
    // READ EXISTING FILE
    ////////////////////////////////////////////////////////////

    let existingData = {
        totalCruises: 0,
        scrapedAt: null,
        cruises: []
    };

    if (fs.existsSync(outputFile)) {
        try {
            const raw = fs.readFileSync(outputFile, "utf-8");
            existingData = JSON.parse(raw);
        } catch {
            console.log("⚠️ Could not parse existing file. Recreating.");
        }
    }

    ////////////////////////////////////////////////////////////
    // MERGE + REMOVE DUPLICATES (BY LINK)
    ////////////////////////////////////////////////////////////

    const mergedCruises = [
        ...(existingData.cruises || []),
        ...newCruises
    ];

    const uniqueMap = new Map();

    for (const cruise of mergedCruises) {
        if (cruise.link) {
            uniqueMap.set(cruise.link, cruise);
        }
    }

    const finalCruises = Array.from(uniqueMap.values());

    ////////////////////////////////////////////////////////////
    // SAVE FINAL FILE
    ////////////////////////////////////////////////////////////

    const finalData = {
        totalCruises: finalCruises.length,
        scrapedAt: new Date().toISOString(),
        cruises: finalCruises
    };

    fs.writeFileSync(
        outputFile,
        JSON.stringify(finalData, null, 2),
        "utf-8"
    );

    console.log(`✅ ${newCruises.length} cruises scraped from Viking`);
    console.log(`📦 Total cruises in file: ${finalCruises.length}`);
}

export { scrape_viking_cruises }

// scrape_viking_cruises();
