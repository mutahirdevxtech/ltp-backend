import fs from "fs/promises";

// SCRAPERS
import { scrape_azamara } from "./azamara/index.mjs";
import { scrape_ncl } from "./ncl/index.mjs";
import { scrape_oceania } from "./oceania-cruises/index.mjs";
import { scrape_regent_sevenseas } from "./regent-sevenseas/index.mjs";
import { scrape_ritz_carlton } from "./ritz-carlton-cruises/index.mjs";
import { scrape_silversea } from "./silversea/index.mjs";
import { scrape_viking_cruises } from "./viking-cruises/index.mjs";
import { scrape_virgin_cruises } from "./virgin-cruises/index.mjs";

const files = [
    "./azamara/data.json",
    "./ncl/data.json",
    "./oceania-cruises/data.json",
    "./regent-sevenseas/data.json",
    "./ritz-carlton-cruises/data.json",
    "./silversea/data.json",
    "./viking-cruises/data.json",
    "./virgin-cruises/data.json"
];

//////////////////////////////////////////////////////////
// DELETE OLD JSON FILES
//////////////////////////////////////////////////////////

async function deleteOldJsonFiles() {
    for (const file of files) {
        try {
            await fs.unlink(file);
            console.log(`🗑 Deleted: ${file}`);
        } catch (err) {
            if (err.code !== "ENOENT") {
                console.error(`❌ Error deleting ${file}:`, err.message);
            } else {
                console.log(`⚠️ File not found (skipped): ${file}`);
            }
        }
    }

    console.log("🧹 Old JSON files cleanup completed.");
}

//////////////////////////////////////////////////////////
// RUN SCRAPERS
//////////////////////////////////////////////////////////

async function runAllScrapers() {
    console.log("🚀 Starting scrapers...");

    console.log("started: scrape_azamara");
    await scrape_azamara();
    console.log("ended: scrape_azamara");

    console.log("started: scrape_ncl");
    await scrape_ncl();
    console.log("ended: scrape_ncl");

    console.log("started: scrape_oceania");
    await scrape_oceania();
    console.log("ended: scrape_oceania");

    console.log("started: scrape_regent_sevenseas");
    await scrape_regent_sevenseas();
    console.log("ended: scrape_regent_sevenseas");

    console.log("started: scrape_ritz_carlton");
    await scrape_ritz_carlton();
    console.log("ended: scrape_ritz_carlton");

    console.log("started: scrape_silversea");
    await scrape_silversea();
    console.log("ended: scrape_silversea");

    console.log("started: scrape_viking_cruises");
    await scrape_viking_cruises();
    console.log("ended: scrape_viking_cruises");

    console.log("started: scrape_virgin_cruises");
    await scrape_virgin_cruises();
    console.log("ended: scrape_virgin_cruises");

    console.log("✅ All scraping completed.");
}

//////////////////////////////////////////////////////////
// MERGE FILES
//////////////////////////////////////////////////////////

async function mergeCruiseFiles() {
    let allCruises = [];

    for (const file of files) {
        try {
            const raw = await fs.readFile(file, "utf-8");
            const parsed = JSON.parse(raw);

            if (parsed?.cruises && Array.isArray(parsed.cruises)) {
                allCruises = allCruises.concat(parsed.cruises);
            }
        } catch (err) {
            console.log(`⚠️ Skipped ${file} - ${err.message}`);
        }
    }

    const final_json = {
        totalCruises: allCruises.length,
        scrapedAt: new Date().toISOString(),
        cruises: allCruises
    };

    await fs.writeFile(
        "./data.json",
        JSON.stringify(final_json, null, 2)
    );

    console.log(`📦 Final data.json created with ${allCruises.length} cruises`);
}

//////////////////////////////////////////////////////////
// MAIN
//////////////////////////////////////////////////////////

async function main() {
    try {
        // await deleteOldJsonFiles();   // 1️⃣ Clean
        await runAllScrapers();       // 2️⃣ Scrape
        // await mergeCruiseFiles();     // 3️⃣ Merge
    } catch (err) {
        console.error("❌ Error:", err);
    }
}

main();
