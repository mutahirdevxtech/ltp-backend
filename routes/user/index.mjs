import { Router } from "express";
import { createBookingController } from "../../controllers/index.mjs"

const router = Router()

// bookings
router.post("/booking", createBookingController)

export default router