import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
    });
    return data;
}

// Convert "Fri, Feb 20" → "2026-02-20"
function formatDate(dateStr) {
    if (!dateStr) return null;

    // Remove emoji
    dateStr = dateStr.replace(/[^\w\s,]/g, "").trim();

    const parts = dateStr.split(",");
    if (parts.length < 2) return null;

    const datePart = parts[1].trim(); // "Feb 20"
    const [monthStr, day] = datePart.split(" ");

    const months = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };

    const month = months[monthStr];
    if (!month) return null;

    const year = new Date().getFullYear(); // or hardcode if needed

    return `${year}-${month}-${day.padStart(2, "0")}`;
}

function cleanTitle(title) {
    if (!title) return null;

    // Remove "& More" globally
    title = title.replace(/& More/g, "").trim();

    const parts = title.split(",");
    const first = parts[0]?.trim();
    const last = parts[parts.length - 1]?.trim();

    if (first && last && first !== last) {
        // Agar comma wali logic lagti hai
        return `${first} to ${last}`.replace("&", "to").trim();
    }

    // Agar sirf single name ya comma nahi hai
    let _title = title.replace("&", "to").trim()

    if (_title.includes(" to ")) {
        return _title
    } else {
        return `${_title} to ${_title}`
    }
}

function cleanDuration(duration) {
    if (!duration) return null;

    const number = duration.match(/\d+/)?.[0];
    return number ? `${number} DAYS` : null;
}

function cleanPrice(price) {
    if (!price) return null;

    return price.replace(/(\$\d[\d,]*)(?=\$)/g, "$1 ");
}

function extractVirginCruises(html) {
    const $ = cheerio.load(html);
    const baseURL = "https://www.virginvoyages.com";
    const cruises = [];

    $("#PackageCardChooseVoyage .PackageCard").each((i, card) => {
        const el = $(card);

        let image = el.find(".mediaImg img").attr("src") || null;
        let rawTitle = el.find(".packageName").text().trim() || null;
        let ship = el.find(".shipName").text().trim() || null;
        let rawDuration = el.find(".duration").text().trim() || null;

        let link = el.find(".fullCruiseBtn a").attr("href") || null;
        if (link && !link.startsWith("http")) {
            link = baseURL + link;
        }

        let rawPrice = el.find(".priceTotal, .price").first().text().trim() || null;

        let startDate = null;
        let endDate = null;

        const firstSailing = el.find(".sailingCards .SailingCard").first();
        if (firstSailing.length) {
            const dates = firstSailing
                .find(".startEndDate")
                .text()
                .trim()
                .split("-");

            if (dates.length === 2) {
                startDate = formatDate(dates[0].trim());
                endDate = formatDate(dates[1].trim());
            }
        }

        cruises.push({
            title: cleanTitle(rawTitle),
            ship: ship.split(/ & |,/).map(s => s.trim()),
            startDate,
            endDate,
            duration: cleanDuration(rawDuration),
            price: cleanPrice(rawPrice),
            link,
            image,
            provider: "VIRGIN_CRUISES"
        });
    });

    return cruises;
}

async function scrape_virgin_cruises() {
    const url =
        "https://www.virginvoyages.com/book/voyage-planner/find-a-voyage?currencyCode=USD";

    const outputFile = "./data.json";

    try {
        const html = await fetchHTML(url);
        const newCruises = extractVirginCruises(html);

        ////////////////////////////////////////////////////////////
        // READ EXISTING FILE (IF EXISTS)
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
        // APPEND + REMOVE DUPLICATES (by link)
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
        // FINAL STRUCTURE
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

        console.log(`✅ ${newCruises.length} new cruises scraped`);
        console.log(`📦 Total cruises in file: ${finalCruises.length}`);

    } catch (err) {
        console.error("Error:", err.message);
    }
}

export { scrape_virgin_cruises }
