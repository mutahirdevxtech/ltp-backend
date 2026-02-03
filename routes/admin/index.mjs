import { Router } from "express";
import {
    createContactUsController,
    createSingleUserController,
    getAdminAnalytics,
    getAllContactUs,
    getBulkUsersController,
    getCruiseDataController,
    getSingleContactUsController,
    getSingleUserController,
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

export default router
