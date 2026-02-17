import { Router } from "express";
import { createBookingController, getBookingsController } from "../../controllers/index.mjs"
import { errorMessages } from "../../utils/errorMessages.mjs";
import { isValidObjectId } from "mongoose";

const router = Router()

// bookings
router.post("/booking", createBookingController)
router.get("/bookings", (req, res, next) => {
    const userId = req?.currentUser?._id
    if (!userId) return res.status(400).send({ message: errorMessages.idIsMissing })
    if (!isValidObjectId(userId)) return res.status(400).send({ message: errorMessages.invalidId })
    req.body.userId = userId
    next()
}, getBookingsController)

export default router