import fs from "fs";

const API_URL = "https://www.azamara.com/api/1/services/search/get-all-cruises-cached.json";
const OUTPUT_FILE = "./data.json";

// Helper: decode HTML entities like &amp;
function decodeHtml(str) {
    if (!str) return str;
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

// Helper: format price number -> "$1,839"
function formatPrice(num) {
    if (num === null || num === undefined || num === -1) return null;
    return "$" + Number(num).toLocaleString("en-US");
}

function simplifyTitle(voyageName) {
    if (!voyageName) return null;

    // Decode HTML once
    let decoded = decodeHtml(voyageName);

    // Agar already " TO " present hai → return decoded as-is
    if (decoded.toUpperCase().includes(" TO ")) {
        return decoded;
    }

    // Agar colon present hai → simplify
    if (decoded.includes(":")) {
        let parts = decoded.split(":");
        let routePart = parts[1].trim();

        let ports = routePart.split(/,|&/).map(s => s.trim()).filter(Boolean);

        if (ports.length === 0) return routePart;

        let start = ports[0];
        let end = ports[ports.length - 1];

        return `${start} to ${end}`;
    }

    // Default: return decoded
    return decoded;
}

async function scrape_azamara() {
    console.log("🚀 Fetching Azamara API...");

    const res = await fetch(API_URL, {
        headers: { accept: "application/json" }
    });

    if (!res.ok) {
        throw new Error("Failed to fetch API: " + res.status);
    }

    const raw = await res.json();

    const results = raw.results || [];
    console.log("📦 Raw records:", results.length);

    const cruises = results.map(item => {
        const durationNum = item.vacationDuration || item.voyageDuration || null;

        return {
            title: simplifyTitle(decodeHtml(item.voyageName || item.name || null)),
            ship: Array.isArray(item.ships) ? item.ships || [] : [],
            startDate: item.vacationStartDate || null,
            endDate: item.vacationEndDate || null,
            duration: durationNum ? `${durationNum} DAYS` : null,
            price: formatPrice(item.extendedVoyageData?.pricing?.voyagePricePerPersonStartingFrom),
            link: item.voyagePdpUrl
                ? "https://www.azamara.com" + item.voyagePdpUrl
                : null,
            image: item.voyageImageUrl
                ? "https://www.azamara.com" + item.voyageImageUrl
                : null,
            provider: "AZAMARA",
            objectId: item?.objectId || null,
        };
    });

    const output = {
        totalCruises: cruises.length,
        scrapedAt: new Date().toISOString(),
        cruises
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");

    console.log(`✅ Done! Saved ${cruises.length} cruises to ${OUTPUT_FILE}`);
}

export { scrape_azamara }

// // Run
// scrape_azamara().catch(err => {
//     console.error("❌ Error:", err.message);
// });
