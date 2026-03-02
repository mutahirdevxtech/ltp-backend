import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

/**
 * Parse Princess Itinerary
 */
function parsePrincess(html) {
  const $ = cheerio.load(html);

  function formatDate(fullDateText) {
    // Example input: "Saturday, May 2nd 2026"

    if (!fullDateText) return null;

    // Remove ordinal suffix (2nd → 2)
    const clean = fullDateText.replace(/(\d+)(st|nd|rd|th)/, "$1");

    const dateObj = new Date(clean);

    if (isNaN(dateObj)) return null;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const itinerary = [];
  const countriesSet = new Set();

  $("table.ports-table tbody tr.ports-table-row").each((i, row) => {
    const date = $(row)
      .find("td.date-cell span[aria-hidden='true']")
      .text()
      .trim();

    const portText =
      $(row)
        .find("td.port-cell span.gotham-bold, td.port-cell span.false")
        .first()
        .text()
        .trim() || "At Sea";

    let arrival = $(row).find("td.arrive-cell span").text().trim();
    let departure = $(row).find("td.depart-cell span").text().trim();

    arrival = arrival || null;
    departure = departure || null;

    // Country extraction
    let country = null;
    if (/At Sea/i.test(portText)) {
      country = "At Sea";
    } else if (portText.includes(",")) {
      const parts = portText.split(",");
      country = parts[parts.length - 1].trim();
    }

    if (country !== "At Sea") countriesSet.add(country);

    itinerary.push({
      date,
      port: portText,
      country,
      arrival,
      departure,
    });
  });

  return {
    totalPorts: itinerary.length,
    totalCountries: countriesSet.size,
    countries: Array.from(countriesSet),
    itinerary,
  };
}

/**
 * Main Scraper
 */
async function scrapePrincess(url) {
  // const url =
  //   "https://www.princess.com/cruise-search/details/?voyageCode=A617";

  try {
    console.log("🚀 Launching browser...");

    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    console.log("🌐 Opening page...");
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    // Wait specifically for itinerary table
    await page.waitForSelector("table.ports-table", { timeout: 0 });

    console.log("📄 Extracting HTML...");
    const html = await page.content();

    console.log("📦 Parsing itinerary...");
    const result = parsePrincess(html);
    await browser.close();
    return result
    // fs.writeFileSync("data.json", JSON.stringify(result, null, 2));

    // console.log("✅ Done! Data saved.");
    // console.log("Total Ports:", result.totalPorts);

  } catch (err) {
    console.error("❌ Error:", err.message);
    return null
  }
}

export { scrapePrincess }
