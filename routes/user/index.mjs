import { Router } from "express";
import { createBookingController, getAllCardsController, getBookingsController } from "../../controllers/index.mjs"
import { errorMessages } from "../../utils/errorMessages.mjs";
import { isValidObjectId } from "mongoose";

const router = Router()

// bookings
router.post("/booking", createBookingController)

router.get("/bookings", (req, res, next) => {
    const userId = req?.currentUser?._id
    if (!userId) return res.status(400).send({ message: errorMessages.idIsMissing })
    if (!isValidObjectId(userId)) return res.status(400).send({ message: errorMessages.invalidId })
    req.query.userId = userId
    next()
}, getBookingsController)

router.get("/cards", (req, res, next) => {
    const userId = req?.currentUser?._id
    if (!userId) return res.status(400).send({ message: errorMessages.idIsMissing })
    if (!isValidObjectId(userId)) return res.status(400).send({ message: errorMessages.invalidId })
    req.query.userId = userId
    next()
}, getAllCardsController)

export default router