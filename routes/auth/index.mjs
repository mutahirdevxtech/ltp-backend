import { Router } from "express"
import {
    signupController, emailLoginController, facebookLoginController,
    googleLoginController, forgotPasswordEmailCompleteController,
    forgotPasswordEmailController, is2FaEnabledController,
    secureLoginController, sendSecureLoginOtpController,
    verifyLoginOtpController, verifyEmailOtpController,
    verifyEmailCompleteController,
    forgotPasswordVerifyOtp
} from "../../controllers/index.mjs"
import { issueLoginToken } from "../../middlewares/index.mjs"

const router = Router()

router.post("/signup", signupController)
router.post("/email-login", emailLoginController, issueLoginToken, (req, res) => res.send({ message: "email login successfull", data: { ...req?.loginTokenPayload, token: req?.hart } }))
router.post("/google-login", googleLoginController, issueLoginToken, (req, res) => res.send({ message: "google login successfull", data: { ...req?.loginTokenPayload, token: req?.hart } }))
router.post("/facebook-login", facebookLoginController, issueLoginToken, (req, res) => res.send({ message: "facebook login successfull", data: { ...req?.loginTokenPayload, token: req?.hart } }))

router.post("/verify-email-otp", verifyEmailOtpController)
router.post("/verify-email-complete", verifyEmailCompleteController)

router.post("/forgot-password-email", forgotPasswordEmailController)
router.post("/forgot-password-verify-otp", forgotPasswordVerifyOtp)
router.post("/reset-password", forgotPasswordEmailCompleteController)

router.get("/two-factor-authentication", is2FaEnabledController)
router.post("/secure-login", secureLoginController)
router.post("/secure-login-otp", sendSecureLoginOtpController)
router.post("/verify-secure-login", verifyLoginOtpController, issueLoginToken, (req, res) => res.send({ message: "login successfull", data: req?.loginTokenPayload }))

export default router
