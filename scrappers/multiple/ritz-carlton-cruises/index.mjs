import puppeteer from "puppeteer";
import fs from "fs";
import * as cheerio from "cheerio";
import { addDays, parse } from "date-fns";
import { randomUUID } from "crypto";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function simplifyTitle(voyageName) {
    if (!voyageName) return null;
    return voyageName.toUpperCase().trim().replace("/", "to");
}

function appendUniqueItems(filePath, newItems) {
    let data = {
        totalCruises: 0,
        scrapedAt: new Date().toISOString(),
        cruises: []
    };

    if (fs.existsSync(filePath)) {
        try {
            const raw = fs.readFileSync(filePath, "utf-8").trim();
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.cruises && Array.isArray(parsed.cruises)) {
                    data = parsed;
                } else if (Array.isArray(parsed)) {
                    data.cruises = parsed;
                }
            }
        } catch { }
    }

    const existingLinks = new Set(data.cruises.map((i) => i.link));
    const filtered = newItems.filter((i) => i.link && !existingLinks.has(i.link));

    data.cruises.push(...filtered);
    data.totalCruises = data.cruises.length;
    data.scrapedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${filtered.length} new cruises, total: ${data.totalCruises}`);

    return filtered.length; // 👈 important for stop condition
}

function parseDuration(durationText) {
    const match = durationText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function calculateEndDate(startDateText, durationText) {
    try {
        const duration = parseDuration(durationText);
        const parsedDate = parse(startDateText, "EEEE, MMMM d, yyyy", new Date());
        const endDate = addDays(parsedDate, duration);
        return endDate.toISOString().split("T")[0];
    } catch {
        return null;
    }
}

const toISODate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d.toISOString().split("T")[0];
};

async function scrape_ritz_carlton() {
    console.log("🚀 Launching browser...");
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    const page = await browser.newPage();

    const url = "https://www.ritzcarltonyachtcollection.com/luxury-mediterranean-cruises";
    console.log("🌐 Opening:", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await delay(5000);

    let hasMore = true;

    while (hasMore) {
        const html = await page.content();
        const $ = cheerio.load(html);

        let batch = [];
        let newCountThisPage = 0;

        $("#scrollPosition > div.grid > div.relative").each((i, el) => {
            const card = $(el);

            const ship = card.find("div.italic").text().trim();
            const route = card.find("h2").text().trim();

            const startDateText = card
                .find("div.flex.flex-col.gap-3.mb-6.text-content.uppercase > div:nth-child(1) > div")
                .first()
                .text()
                .trim();

            const duration = card
                .find("div.flex.flex-col.gap-3.mb-6.text-content.uppercase > div:nth-child(2) > div")
                .first()
                .text()
                .trim();

            const endDate = calculateEndDate(startDateText, duration);

            const priceRaw = card.find("span:contains('$')").first().text().trim();
            const price = priceRaw.replace(/\s*USD\*?/, "").trim();

            const linkHref = card.find('a[href*="luxury"]').attr("href");
            const link = linkHref?.startsWith("/")
                ? "https://www.ritzcarltonyachtcollection.com" + linkHref
                : linkHref;

            const imgStyle = card.find("div.absolute.bg-cover").first().attr("style");
            const imageMatch = imgStyle?.match(/url\("?(.*?)"?\)/);
            const image = imageMatch ? imageMatch[1] : null;

            batch.push({
                title: simplifyTitle(route),
                ship: ship ? [ship] : [],
                startDate: toISODate(startDateText),
                endDate,
                duration: duration,
                price,
                link,
                image,
                provider: "RITZ_CARLTON_CRUISES",
                objectId: randomUUID(),
            });

            if (batch.length === 10) {
                const added = appendUniqueItems("data.json", batch);
                newCountThisPage += added;
                batch = [];
            }
        });

        if (batch.length > 0) {
            const added = appendUniqueItems("data.json", batch);
            newCountThisPage += added;
            batch = [];
        }

        // 🛑 Stop if no new data found
        if (newCountThisPage === 0) {
            console.log("🛑 No new data found on this page. Stopping scraping.");
            break;
        }

        // 👉 Click Next
        try {
            const nextExists = await page.$$eval("div.cursor-pointer", (divs) => {
                const nextDiv = divs.find((d) => d.textContent.trim().startsWith("Next"));
                if (nextDiv) {
                    nextDiv.scrollIntoView();
                    nextDiv.click();
                    return true;
                }
                return false;
            });

            if (!nextExists) {
                console.log("✅ No more pages.");
                break;
            } else {
                console.log("👉 Clicked Next page...");
                await delay(4000);
            }
        } catch (err) {
            console.log("✅ Next button not found or error:", err);
            break;
        }
    }

    await browser.close();
    console.log("✅ Done! All cruises saved to data.json");
}

export { scrape_ritz_carlton }
