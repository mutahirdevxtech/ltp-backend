import { Router } from "express";
import { createContactUsController } from "../../controllers/index.mjs"

const router = Router()

// contact us
router.post("/contact", createContactUsController)

export default router
