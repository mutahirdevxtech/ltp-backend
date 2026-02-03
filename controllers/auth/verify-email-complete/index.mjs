import moment from "moment";
import bcrypt from "bcrypt";
import { userModel, verifyEmailOtpModel } from "../../../models/index.mjs";
import { emailPattern, otpPattern } from "../../../utils/core.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
// import { sendWelcomeEmail } from "../../../libs/postmark.mjs";

export const verifyEmailCompleteController = async (req, res, next) => {
    try {
        const { email, otpCode } = req?.body
        if (!email || email?.trim() === "") {
            return res.status(400).send({
                message: errorMessages?.emailRequired
            })
        }
        if (!otpCode) {
            return res.status(400).send({
                message: errorMessages?.otpRequired
            })
        }
        if (!emailPattern?.test(email?.trim()?.toLowerCase())) {
            return res.status(400).send({
                message: errorMessages?.emailInvalid
            })
        }
        if (!otpPattern?.test(otpCode)) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }

        const user = await userModel?.findOne({ email: email?.trim()?.toLowerCase() }).exec()
        if (!user) {
            return res.status(404).send({
                message: errorMessages?.noAccountFound
            })
        }

        const otp = await verifyEmailOtpModel.findOne({ email: email?.trim()?.toLowerCase() }).sort({ _id: -1 }).exec()
        if (!otp) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }

        const isExpired = moment().isAfter(moment(otp?.createdAt).add(15, 'minutes'));
        if (isExpired) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }
        if (otp?.isUsed) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }

        const isOtpValid = await bcrypt.compare(otpCode, otp?.otpCodeHash)
        if (!isOtpValid) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }

        otp.isUsed = true
        await otp.save()

        user.isEmailVerified = true
        await user.save()

        // pstmark email
        // await sendWelcomeEmail(user?.email?.toLowerCase(), user?.firstName)

        res.send({ message: "email verified successfully" })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
