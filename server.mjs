import "dotenv/config"
import "./libs/db.mjs"
import express, { json } from "express"
import morgan from "morgan"
import cors from "cors"
import cookieParser from "cookie-parser"

import { allowedOrigins } from "./utils/core.mjs"
import { authenticationMiddleware, limiter, rolesRoutesMiddleware } from "./middlewares/index.mjs"
import { authRoutes, profileRoutes, unAuthRoutes } from "./routes/index.mjs"
import { activeAccountMiddleware } from "./middlewares/jwt/index.mjs"

const app = express()

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(limiter)
app.use(morgan("dev"))
app.use(json())
app.use(cookieParser())

app.get("/", (req, res) => res.send("Hello from developer"))
app.use("/api/v1", authRoutes, unAuthRoutes, authenticationMiddleware, profileRoutes, activeAccountMiddleware, rolesRoutesMiddleware)

const PORT = process.env.PORT || 5002
app.listen(PORT, () => console.log(`server running on port ${PORT}`))
