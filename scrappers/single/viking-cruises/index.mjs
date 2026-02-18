import axios from "axios";
import * as cheerio from "cheerio";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function getSingleCruiseDataViking(url) {
    const { data: html } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
        },
        timeout: 0
    });

    await delay(2000); // optional

    const $ = cheerio.load(html);

    const itinerary = [];

    $(".dynamic-day").each((i, el) => {
        const cityText = $(el).find(".city-label").text().trim();

        let port = cityText || null;
        let country = null;

        if (cityText && cityText.includes(",")) {
            const parts = cityText.split(",");
            country = parts[parts.length - 1].trim();
        } else if (cityText === "At Sea") {
            country = "At Sea";
        }

        itinerary.push({
            date: null,
            port,
            country,
            arrival: null,
            departure: null,
        });
    });

    const filtered = itinerary.filter((i) => i.port);
    const countries = [...new Set(filtered.map((i) => i.country))];

    return {
        totalPorts: filtered.length,
        totalCountries: countries.length,
        countries,
        itinerary: filtered,
    };
}

export { getSingleCruiseDataViking };
