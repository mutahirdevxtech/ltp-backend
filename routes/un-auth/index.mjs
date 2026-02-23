import { Router } from "express";
import { createContactUsController, getCruiseDataController, getCruiseDestinationsController, getCruiseOriginsController, getCruiseProvidersController, getCruiseShipsController, getSingleCruiseDataController } from "../../controllers/index.mjs"

const router = Router()

// contact us
router.post("/contact", createContactUsController)

// cruise data
router.get("/cruise-providers", getCruiseProvidersController)
router.get("/cruise-ships", getCruiseShipsController)
router.get("/cruise-origins", getCruiseOriginsController)
router.get("/cruise-destinations", getCruiseDestinationsController)
router.get("/cruises", getCruiseDataController)
router.get("/cruise/:cruiseId", getSingleCruiseDataController)

export default router
