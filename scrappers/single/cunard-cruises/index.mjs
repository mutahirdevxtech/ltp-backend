import fs from "fs";

async function scrapeCunard(url) {
  try {
    // const itinId = "Q607";
    const itinId = url.split("/").filter(Boolean).pop();
    const url = `https://www.cunard.com/map/itineraries/${itinId}/json/en_GB_${itinId}.json`;

    console.log("🚀 Fetching itinerary API...");
    console.log(url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.cunard.com/"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log("✅ Data received");

    const portsOrder = data.ports;
    const portDetails = data.itinPorts;

    // code → label mapping
    const portMap = {};
    portDetails.forEach(p => {
      portMap[p.code] = p.label;
    });

    const itinerary = [];
    const countriesSet = new Set();

    portsOrder.forEach(code => {
      if (code === "ATSEADAY") return;

      const portName = portMap[code] || code;

      // simple country extraction
      const country = portName.includes(",")
        ? portName.split(",").pop().trim()
        : portName;

      countriesSet.add(country);

      itinerary.push({
        port: portName,
        country,
        arrival: null,
        departure: null
      });
    });

    const result = {
      totalPorts: itinerary.length,
      totalCountries: countriesSet.size,
      countries: [...countriesSet],
      itinerary
    };
    return result
    // 🔥 SAVE FILE
    // fs.writeFileSync("data.json", JSON.stringify(result, null, 2));

    // console.log("💾 Saved to data.json");
    console.log("🎯 Done!");

  } catch (err) {
    return null
    console.error("❌ Error:", err.message);
  }
}

export { scrapeCunard }
