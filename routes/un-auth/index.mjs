import { Router } from "express";
import { createContactUsController, getCruiseDestinationsController, getCruisePortsController, getCruiseStateRoomsController } from "../../controllers/index.mjs"

const router = Router()

// contact us
router.post("/contact", createContactUsController)

// cruise data
router.get("/cruise-ports", getCruisePortsController)
router.get("/cruise-destinations", getCruiseDestinationsController)
router.get("/cruise-staterooms", getCruiseStateRoomsController)

export default router
