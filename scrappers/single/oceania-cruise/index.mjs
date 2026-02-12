import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fetch HTML from URL
 */
async function fetchHTML(url) {
    const { data } = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        },
    });
    return data;
}

/**
 * Extract data from itinerary table
 */
function extractOceaniaItinerary(html) {
    const $ = cheerio.load(html);

    const result = {
        totalPorts: 0,
        totalCountries: 0,
        countries: [],
        itinerary: [],
    };

    const countriesSet = new Set();

    const rows = $("table.itinerary.table-oc tbody tr");

    rows.each((i, row) => {
        const dateText = $(row).find("td.itin-date").text().trim();
        const portText = $(row)
            .find("td.itin-port-name span")
            .first()
            .text()
            .trim();

        // 🚨 Skip empty / invalid rows
        if (!dateText && !portText) {
            return; // continue
        }

        let arrival = $(row).find("td.itin-start-time span").text().trim();
        let departure = $(row).find("td.itin-end-time span").text().trim();

        arrival = arrival || null;
        departure = departure || null;

        // ---- Country logic ----
        let country = null;

        if (/At Sea/i.test(portText)) {
            country = "At Sea";
        } else if (portText.includes(",")) {
            const parts = portText.split(",");
            country = parts[parts.length - 1].trim();
        }

        if (country) countriesSet.add(country);

        // ---- Clean date: "Feb 26 Thu" -> "Feb 26" ----
        let date = null;
        if (dateText) {
            date = dateText.split(" ").slice(0, 2).join(" ");
        }

        result.itinerary.push({
            date: date,
            port: portText || null,
            country: country,
            arrival: arrival,
            departure: departure,
        });
    });

    result.countries = Array.from(countriesSet);
    result.totalPorts = result.itinerary.length;
    result.totalCountries = result.countries.length;

    return result;
}

/**
 * Public function
 */
async function getSingleCruiseDataOceania(cruiseURL) {
    try {
        const html = await fetchHTML(cruiseURL);
        const data = extractOceaniaItinerary(html);
        return data;
    } catch (err) {
        console.error("Error:", err.message);
        return null;
    }
}

export { getSingleCruiseDataOceania };
