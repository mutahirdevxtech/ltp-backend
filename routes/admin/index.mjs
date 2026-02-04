import { Router } from "express";
import {
    createBookingController,
    createContactUsController,
    createSingleUserController,
    getAdminAnalytics,
    getAllContactUs,
    getBookingsController,
    getBulkUsersController,
    getCruiseDataController,
    getSingleBookingController,
    getSingleContactUsController,
    getSingleUserController,
    updateBookingController,
    updateSingleContactUsController,
    updateSingleUserController,
} from "../../controllers/index.mjs"
import { multerFileUploadMiddleware } from "../../libs/multer.mjs"

const router = Router()

// analytics
router.get("/analytics", getAdminAnalytics)

// cruises
router.get("/cruise-data", getCruiseDataController)

// users
// router.post("/user", multerFileUploadMiddleware.any(), createSingleUserController)
// router.get("/user/:userId", getSingleUserController)
// router.put("/user/:userId", multerFileUploadMiddleware.any(), updateSingleUserController)
// router.get("/users", getBulkUsersController)

// contact us
router.post("/contact", createContactUsController)
router.get("/contact/:contactId", getSingleContactUsController)
router.put("/contact/:contactId", updateSingleContactUsController)
router.get("/contacts", getAllContactUs)

// bookings
router.post("/booking", createBookingController)
router.get("/booking/:bookingId", getSingleBookingController)
router.put("/booking/:bookingId", updateBookingController)
router.get("/bookings", getBookingsController)

export default router
