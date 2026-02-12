import "dotenv/config"
import "./libs/db.mjs"
import express, { json } from "express"
import morgan from "morgan"
import cors from "cors"
import http from "http"
import cookieParser from "cookie-parser"

import { allowedOrigins } from "./utils/core.mjs"
import { authenticationMiddleware, limiter, rolesRoutesMiddleware } from "./middlewares/index.mjs"
import { authRoutes, profileRoutes, unAuthRoutes } from "./routes/index.mjs"
import { activeAccountMiddleware } from "./middlewares/jwt/index.mjs"
import { cruiseModel } from "./models/index.mjs"
import { azamara_cruises, silversea_cruises } from "./data/index.mjs"

const app = express()

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    credentials: true, // important for cookies/auth
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(limiter)
app.use(morgan("dev"))
app.use(json())
app.use(cookieParser())

const startPort = Number(process.env.PORT) || 5002;

app.get("/", (req, res) => res.send("Hello from developer"))
app.use("/api/v1", authRoutes, unAuthRoutes, authenticationMiddleware, profileRoutes, activeAccountMiddleware, rolesRoutesMiddleware)


// DEV APIS: ONLY BACKEND DEVELOPERS ARE ALLOWED TO CALL
app.get("/add-silversea-data-by-dev", async (req, res) => {
    // await cruiseModel.create(silversea_cruises)
    res.send("silversea cruise data added")
})

app.get("/add-azamara-data-by-dev", async (req, res) => {
    // await cruiseModel.create(azamara_cruises)
    res.send("azamara cruise data added")
})

app.get("/operation", async (req, res) => {
    // await cruiseModel.deleteMany({ provider: "AZAMARA" })
    res.send("query executed")
})


// PORT LISTENING
// const PORT = process.env.PORT || 5002 || 5003
// app.listen(PORT, () => console.log(`server running on port ${PORT}`))
function startServer(port) {
   const server = http.createServer({ maxHeaderSize: 32 * 1024 }, app);

    server.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.log(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error("❌ Server error:", err);
        }
    });
}

startServer(startPort);