import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

/**
 * Fetch HTML
 */
async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });
    return data;
}

/**
 * Parse Royal Caribbean Itinerary
 */
function parseRoyalCaribbean(html) {
    const $ = cheerio.load(html);
    const itinerary = [];
    const countriesSet = new Set();

    $("h3[data-testid^='chapter-list-item-']").each((i, el) => {

        const dayLabel = $(el).find("span").first().text().trim();

        // Skip Cruise Overview
        if (!dayLabel.includes("Day")) return;

        const wrapper = $(el).find("span._44w8nh4");

        const dayNumber = wrapper
            .children("span._44w8nh5._1yq2ujmd")
            .first()
            .text()
            .trim();

        // const dayNumber = $(el)
        //     .find("span._44w8nh5._1yq2ujmd")
        //     .text()
        //     .trim();

        const portText = $(el)
            .find("._1yq2ujmj")
            .text()
            .trim();

        const timeText = $(el)
            .find("._44w8nh5._1yq2ujmd")
            .last()
            .text()
            .trim();

        let port = portText || "At Sea";
        let country = "At Sea";
        let arrival = null;
        let departure = null;

        // Handle Sea Day
        if (port.toLowerCase().includes("sea")) {
            port = "At Sea";
            country = "At Sea";
        } else {
            const parts = port.split(",");
            country = parts.length > 1
                ? parts[parts.length - 1].trim()
                : parts[0].trim();
        }

        // Parse times
        if (timeText.includes("Docked from")) {
            const times = timeText
                .replace("Docked from", "")
                .split("-")
                .map(t => t.trim());

            arrival = times[0] || null;
            departure = times[1] || null;
        }
        else if (timeText.includes("Departs at")) {
            departure = timeText.replace("Departs at", "").trim();
        }
        else if (timeText.includes("Arrives at")) {
            arrival = timeText.replace("Arrives at", "").trim();
        }

        if (country !== "At Sea") {
            countriesSet.add(country);
        }

        itinerary.push({
            date: dayNumber,
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
async function scrapeRoyalCaribbean(url) {
    // const url = "https://www.royalcaribbean.com/itinerary/4-night-bahamas-perfect-day-cruise-from-miami-on-wonder-WN4BH277?sailDate=2026-08-31&packageCode=WN4BH277&groupId=WN04MIA-1040267344&country=USA";

    try {
        console.log("🚀 Fetching Royal Caribbean page...");
        const html = await fetchHTML(url);

        console.log("📄 Parsing itinerary...");
        const result = parseRoyalCaribbean(html);
        return result
        // fs.writeFileSync("data.json", JSON.stringify(result, null, 2));
        // console.log("✅ Done! data.json created successfully.");
    } catch (err) {
        console.error("❌ Error:", err.message);
        return null
    }
}

export { scrapeRoyalCaribbean }