import { errorMessages } from "../../../utils/errorMessages.mjs";
import { secureLoginOtpModel, userModel, loginHistoryModel } from "../../../models/index.mjs"
import { emailPattern, otpPattern } from "../../../utils/core.mjs"
import bcrypt from "bcrypt"
import moment from "moment";

export const verifyLoginOtpController = async (req, res, next) => {
    try {
        const { email, otpCode } = req.body;

        if (!email) {
            return res.status(400).send({
                message: errorMessages?.emailRequired
            });
        }
        if (!emailPattern.test(email?.toLowerCase())) {
            return res.status(400).send({
                message: errorMessages?.emailInvalid
            });
        }
        if (!otpCode) {
            return res.status(400).send({
                message: errorMessages?.otpRequired
            });
        }
        if (!otpPattern.test(otpCode)) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            });
        }

        const user = await userModel.findOne({ email: email?.toLowerCase(), isDeleted: false })
            .exec();

        if (!user) {
            return res.status(400).send({
                message: errorMessages?.noAccountFound
            });
        }

        const otp = await secureLoginOtpModel
            .findOne({ email: email?.toLowerCase() })
            .sort({ _id: -1 })
        if (!otp) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            });
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
            await loginHistoryModel.create({
                userId: user?._id,
                loginStatus: "INVALID_OTP",
            })
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }
        otp.isUsed = true
        await otp.save()

        const { password, ...userData } = user?.toObject()
        req.loginTokenPayload = userData
        req.source = "TWO FACTOR"
        next()

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};