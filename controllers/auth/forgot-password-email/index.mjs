import { forgotPasswordOtpModel, userModel } from "../../../models/index.mjs";
import { emailPattern, otpPattern, passwordPattern } from "../../../utils/core.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { checkUserStatusUnAuth } from "../../../utils/functions.mjs"
// import { sendForgotPasswordEmail } from "../../../libs/postmark.mjs"
import otpGenerator from "otp-generator"
import bcrypt from "bcrypt"
import moment from "moment"
import jwt from "jsonwebtoken"

export const forgotPasswordEmailController = async (req, res, next) => {
    try {
        const { email } = req?.body

        if (!email || email?.trim() === "") {
            return res.status(400).send({
                message: errorMessages?.emailRequired
            })
        }

        if (!emailPattern?.test(email?.trim()?.toLowerCase())) {
            return res.status(400).send({
                message: errorMessages?.emailInvalid
            })
        }

        const user = await userModel.findOne({ email: email?.trim()?.toLowerCase(), isDeleted: false }).exec();

        if (!user) {
            return res.status(404).send({
                message: errorMessages?.noAccountFound
            })
        }

        const { isValid, message } = checkUserStatusUnAuth(user?.status)

        if (!isValid) {
            return res.status(401).send({
                message: message
            })
        }

        const query = {
            email: user?.email?.toLowerCase(),
            createdOn: {
                $gte: moment().subtract(24, 'hours').toDate()
            }
        }

        const otp = await forgotPasswordOtpModel.find(query).sort({ _id: -1 }).limit(3).exec();

        // if (otp?.length >= 3) return res.status(405).send({ message: errorMessages.tryIn24Hours })
        // if (otp?.length === 2 && moment().diff(moment(otp[0].createdOn), 'minutes') <= 60) return res.status(405).send({ message: errorMessages.tryIn60Minutes })
        // if (otp?.length === 1 && moment().diff(moment(otp[0].createdOn), 'minutes') <= 5) return res.status(405).send({ message: errorMessages.tryIn05Minutes })

        const otpCode = otpGenerator.generate(
            6,
            {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            }
        )

        const otpCodeHash = await bcrypt.hash(otpCode, 12);
        console.log("forgot password otp==> ", otpCode)

        await forgotPasswordOtpModel.create({
            email: email?.trim()?.toLowerCase(),
            otpCodeHash: otpCodeHash,
        })

        // postmark
        // await sendForgotPasswordEmail(user?.email?.trim()?.toLowerCase(), user?.firstName, otpCode)
        return res.send({ message: errorMessages.forgotPasswordEmailDone })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}

export const forgotPasswordVerifyOtp = async (req, res, next) => {
    try {
        const { email, otpCode } = req?.body

        if (!email || email?.trim() === "") {
            return res.status(400).send({
                message: errorMessages?.emailRequired
            })
        }
        if (!otpCode || otpCode?.trim() === "") {
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

        const user = await userModel?.findOne({ email: email?.trim()?.toLowerCase(), isDeleted: false }).exec()
        if (!user) {
            return res.status(404).send({
                message: errorMessages?.noAccountFound
            })
        }

        const { isValid, message } = checkUserStatusUnAuth(user?.status)
        if (!isValid) {
            return res.status(401).send({
                message: message
            })
        }

        const otp = await forgotPasswordOtpModel.findOne({ email: email?.trim()?.toLowerCase() }).sort({ _id: -1 }).exec()
        if (!otp) {
            return res.status(400).send({
                message: errorMessages?.invalidOtp
            })
        }

        const isExpired = moment().isAfter(moment(otp?.createdOn).add(15, 'minutes'));
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

        const token = jwt?.sign({ email: email?.toLowerCase(), otpCode: otpCode }, process.env.JWT_KEY, { expiresIn: `2h` })
        res.send({ message: "otp has verified", data: { token: token } })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}

export const forgotPasswordEmailCompleteController = async (req, res, next) => {
    try {
        const { token, password } = req?.body

        if (!token) {
            return res.status(400).send({
                message: errorMessages?.noAccessToken
            })
        }
        if (!password || password?.trim() === "") {
            return res.status(400).send({
                message: errorMessages?.passwordRequired
            })
        }
        if (!passwordPattern?.test(password)) {
            return res.status(400).send({
                message: errorMessages?.passwordInvalid
            })
        }

        const payload = jwt.verify(token, process.env.JWT_KEY)
        if (!payload) {
            return res.status(400).send({
                message: errorMessages?.unAuthError
            })
        }

        const { email, otpCode } = payload
        if (!email || !otpCode) {
            return res.status(400).send({
                message: errorMessages?.unAuthError
            })
        }

        const user = await userModel?.findOne({ email: email?.trim()?.toLowerCase(), isDeleted: false }).exec()
        if (!user) {
            return res.status(404).send({
                message: errorMessages?.noAccountFound
            })
        }

        const { isValid, message } = checkUserStatusUnAuth(user?.status)
        if (!isValid) {
            return res.status(401).send({
                message: message
            })
        }

        const otp = await forgotPasswordOtpModel.findOne({ email: email?.trim()?.toLowerCase() }).sort({ _id: -1 }).exec()
        if (!otp) {
            return res.status(400).send({
                message: errorMessages?.unAuthError
            })
        }

        const isExpired = moment().isAfter(moment(otp?.createdOn).add(15, 'minutes'));
        if (isExpired) {
            return res.status(400).send({
                message: errorMessages?.unAuthError
            })
        }

        const isOtpValid = await bcrypt.compare(otpCode, otp?.otpCodeHash)
        if (!isOtpValid) {
            return res.status(400).send({
                message: errorMessages?.unAuthError
            })
        }

        const passwordHash = await bcrypt.hash(password, 12)
        user.password = passwordHash
        await user.save()
        res.send({ message: errorMessages.forgotPasswordEmailCompletedDone })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
