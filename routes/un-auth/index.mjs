import { Router } from "express";
import { createContactUsController, getCruiseDataController, getCruiseDestinationsController, getCruisePortsController, getSingleCruiseDataController } from "../../controllers/index.mjs"

const router = Router()

// contact us
router.post("/contact", createContactUsController)

// cruise data
router.get("/cruise-ports", getCruisePortsController)
router.get("/cruise-destinations", getCruiseDestinationsController)
router.get("/cruises", getCruiseDataController)
router.get("/cruise", getSingleCruiseDataController)

export default router
