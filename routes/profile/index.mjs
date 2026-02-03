import { Router } from "express"
import {
    getLoginHistoryController, getMyProfileController,
    globalSignoutcontroller, logoutController,
    updateProfileController, updateProfilePictureController, updatePasswordController,
    verifyProfileEmailCompleteController, verifyProfileEmailOtpController
} from "../../controllers/index.mjs"
import { getProfileMiddleware } from "../../middlewares/index.mjs"
import { errorMessages } from "../../utils/errorMessages.mjs"
import { multerFileUploadMiddleware } from "../../libs/multer.mjs"

const router = Router()

router.post("/logout", logoutController)
router.get("/profile", getMyProfileController, getProfileMiddleware, (req, res) => res.send({ message: errorMessages?.profileFetched, data: req?.userData }))
router.put("/profile-picture", multerFileUploadMiddleware.any(), updateProfilePictureController)
router.put("/profile", updateProfileController)
router.put("/password", updatePasswordController)

router.get("/login-history", getLoginHistoryController)
router.post("/global-signout", globalSignoutcontroller)

router.post("/profile-email-otp", verifyProfileEmailOtpController)
router.post("/profile-email-complete", verifyProfileEmailCompleteController)

export default router
