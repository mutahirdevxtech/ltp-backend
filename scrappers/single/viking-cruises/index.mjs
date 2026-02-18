// ON AWS EC2 SERVER RUN THIS, IT WILL INSTALL THE REQUIRED DEPENDENCIES OF PUPETEER

// sudo yum install -y \
// atk \
// at-spi2-atk \
// cups-libs \
// gtk3 \
// libXcomposite \
// libXcursor \
// libXdamage \
// libXext \
// libXi \
// libXrandr \
// libXScrnSaver \
// libXtst \
// pango \
// alsa-lib \
// libXfixes \
// libdrm \
// libxcb \
// libxkbcommon \
// nss


import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function getSingleCruiseDataViking(url) {
    const browser = await puppeteer.launch({
        // headless: true,
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]

    });
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    await delay(6000);

    const html = await page.content();
    await browser.close();

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
            departure: null
        });
    });

    const filtered = itinerary.filter((i) => i.port);

    const countries = [...new Set(filtered.map((i) => i.country))];

    const result = {
        totalPorts: filtered.length,
        totalCountries: countries.length,
        countries,
        itinerary: filtered
    };
    return result
};

export { getSingleCruiseDataViking }
