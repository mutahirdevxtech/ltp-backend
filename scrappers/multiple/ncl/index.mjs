import puppeteer from "puppeteer";
import fs from "fs";
import * as cheerio from "cheerio";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: decode HTML entities
function decodeHtml(str) {
    if (!str) return str;
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

// Simplify title like "MALAGA to MIAMI"
function simplifyTitle(voyageName) {
    if (!voyageName) return null;

    let decoded = decodeHtml(voyageName);

    if (decoded.toUpperCase().includes(" TO ")) return decoded.toUpperCase();

    if (decoded.includes(":")) {
        let parts = decoded.split(":");
        let routePart = parts[1].trim();

        let ports = routePart
            .split(/,|&/)
            .map((s) => s.trim())
            .filter(Boolean);

        if (ports.length === 0) return routePart.toUpperCase();

        let start = ports[0].toUpperCase();
        let end = ports[ports.length - 1].toUpperCase();

        return `${start} to ${end}`;
    }

    return decoded.toUpperCase();
}

// Append to JSON file
function appendToJSONFile(filePath, newItems) {
    let existing = [];
    if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        existing = raw ? JSON.parse(raw) : [];
    }
    const combined = existing.concat(newItems);
    fs.writeFileSync(filePath, JSON.stringify(combined, null, 2), "utf-8");
}

function appendUniqueItemsFormatted(filePath, newItems) {
    let existingData = {
        totalCruises: 0,
        scrapedAt: new Date().toISOString(),
        cruises: []
    };

    if (fs.existsSync(filePath)) {
        try {
            const raw = fs.readFileSync(filePath, "utf-8").trim();
            if (raw) {
                existingData = JSON.parse(raw);
            }
        } catch (err) {
            console.log("⚠️ data.json is corrupted or empty. Resetting file...");
        }
    }

    const existingLinks = new Set(existingData.cruises.map(item => item.link));
    const filtered = newItems.filter(item => item.link && !existingLinks.has(item.link));

    existingData.cruises.push(...filtered);
    existingData.totalCruises = existingData.cruises.length;
    existingData.scrapedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
    console.log(`💾 Saved ${filtered.length} new cruises, total: ${existingData.totalCruises}`);
}

async function scrape_ncl() {
    console.log("🚀 Launching browser...");
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();

    const url = "https://www.ncl.com/in/en/vacations";
    console.log("🌐 Opening:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await delay(5000);

    let hasMore = true;

    while (hasMore) {
        const html = await page.content();
        const $ = cheerio.load(html);

        // --- EXTRACT CURRENT BATCH ---
        const results = [];
        $("li.listing_item > article").each((i, el) => {
            const card = $(el);

            const shipLineText = card.find(".c66_label h2").text().trim();
            const title = card.find(".c66_title h2").text().trim();
            const price = card.find(".e55_price_value span").first().text().trim();

            const imgSrc = card.find("figure img").first().attr("src");
            const image = imgSrc?.startsWith("/") ? "https://www.ncl.com" + imgSrc : imgSrc;

            const linkHref = card.find(".c91_cta a").attr("href");
            const link = linkHref?.startsWith("/") ? "https://www.ncl.com" + linkHref : linkHref;

            const durationMatch = shipLineText.match(/(\d+)-day (Cruise|Cruisetour)/i);
            let duration = "";
            let ship = "";
            if (durationMatch) {
                duration = `${durationMatch[1]} DAYS`;
                ship = shipLineText.split(" on ")[1]?.trim() || "";
                // ship = shipLineText.split(" on ").map((s) => s.trim()) || "";
            }

            const dateSpans = card.find(".c282_list_item .e34");
            let startDate = null;
            let endDate = null;

            if (dateSpans.length > 0 && durationMatch) {
                const first = $(dateSpans[0]);
                const startMonth = first.find(".-variant-2").text().replace(",", "").trim();
                const startYear = first.find(".-variant-1").text().trim();

                const start = new Date(`${startMonth} 1, ${startYear}`);
                startDate = start.toISOString().split("T")[0];

                const days = parseInt(durationMatch[1]);
                const end = new Date(start);
                end.setDate(end.getDate() + days - 1);
                endDate = end.toISOString().split("T")[0];
            }

            results.push({
                title: simplifyTitle(title),
                ship: ship ? [ship] : [],
                startDate,
                endDate,
                duration,
                price,
                link,
                image,
                provider: "NCL",
                objectId: null,
            });
        });

        // --- SAVE CURRENT BATCH ---
        // appendToJSONFile("data.json", results);
        appendUniqueItemsFormatted("data.json", results);
        console.log(`💾 Saved ${results.length} cruises to data.json`);

        // --- TRY CLICKING "View More" ---
        try {
            const prevCount = await page.$$eval("li.listing_item > article", els => els.length);
            const button = await page.waitForSelector("button.btn-primary.btn-lg", { timeout: 5000 });
            console.log("👉 Clicking View More Results...");
            await button.click();

            await page.waitForFunction(
                (oldCount) => document.querySelectorAll("li.listing_item > article").length > oldCount,
                { timeout: 15000 },
                prevCount
            );
            await delay(3000); // safety wait
        } catch (err) {
            console.log("✅ No more 'View More Results' button or no more data.");
            hasMore = false;
        }
    }

    await browser.close();
    console.log("✅ Done! All batches saved to data.json");
}

export { scrape_ncl }
