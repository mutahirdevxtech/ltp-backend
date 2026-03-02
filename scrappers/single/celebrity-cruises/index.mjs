import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

/**
 * Fetch HTML from a URL
 */
async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    return data;
}

/**
 * Parse Celebrity Cruises Itinerary
 */
function parseCelebrityCruises(html) {
    const $ = cheerio.load(html);
    const itinerary = [];
    const countriesSet = new Set();

    $("h3[data-testid^='chapter-list-item-']").each((i, el) => {
        const wrapper = $(el).find("span._44w8nh4");

        // Skip Cruise Overview
        if (wrapper.find("span._1yq2ujmn").length) return;

        const dateText = wrapper
            .children("span._44w8nh5._1yq2ujmd")
            .first()
            .text()
            .trim();

        const portText = wrapper
            .children("span._1yq2ujmj")
            .text()
            .trim();

        const timeText = wrapper
            .children("span._44w8nh5._1yq2ujmd")
            .last()
            .text()
            .trim();

        let port = portText || "At Sea";
        let country = "At Sea";
        let arrival = null;
        let departure = null;

        if (port.toLowerCase().includes("sea")) {
            port = "At Sea";
            country = "At Sea";
        } else {
            const parts = port.split(",");
            country = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
        }

        if (timeText.includes("Docked from")) {
            const times = timeText.replace("Docked from", "").split("-").map(t => t.trim());
            arrival = times[0] || null;
            departure = times[1] || null;
        } else if (timeText.includes("Departs at")) {
            departure = timeText.replace("Departs at", "").trim();
        } else if (timeText.includes("Arrives at")) {
            arrival = timeText.replace("Arrives at", "").trim();
        }

        if (country !== "At Sea") {
            countriesSet.add(country);
        }

        itinerary.push({
            date: dateText,
            port,
            country,
            arrival,
            departure
        });
    });

    return {
        totalPorts: itinerary.length,
        totalCountries: countriesSet.size,
        countries: Array.from(countriesSet),
        itinerary
    };
}

/**
 * Main Scraper
 */
async function scrapeCelebrity(url) {
    // const url = "https://www.celebritycruises.com/itinerary/3-night-key-west-bahamas-cruise-from-fort-lauderdale-on-celebrity-RF3BH164?sailDate=2026-08-14&packageCode=RF3BH164&groupId=RF03FLL-2679013690&country=USA";

    try {
        console.log("🚀 Fetching Celebrity Cruises page...");
        const html = await fetchHTML(url);

        console.log("📄 Parsing itinerary...");
        const result = parseCelebrityCruises(html);

        // fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
        return result
        console.log("✅ Done! data.json created successfully.");
    } catch (err) {
        console.error("❌ Error:", err.message);
        return null
    }
}

export { scrapeCelebrity }
