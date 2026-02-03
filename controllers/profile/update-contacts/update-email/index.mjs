import { userModel, verifyEmailOtpModel } from "../../../../models/index.mjs";
import { emailPattern, otpPattern } from "../../../../utils/core.mjs";
import { errorMessages } from "../../../../utils/errorMessages.mjs";
// import { sendEmailVerificationEmail } from "../../../../libs/postmark.mjs";
import otpGenerator from "otp-generator"
import bcrypt from "bcrypt"
import moment from "moment"

export const verifyProfileEmailOtpController = async (req, res, next) => {
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

        const user = await userModel.findOne({
            email: email?.trim()?.toLowerCase(),
            isDeleted: false,
            _id: { $ne: req?.currentUser?._id }
        }).exec();
        if (user) {
            return res.status(404).send({
                message: errorMessages?.emailTaken
            })
        }

        const query = {
            email: email?.toLowerCase(),
            createdAt: { $gte: moment().subtract(24, 'hours').toDate() }
        }

        const otp = await verifyEmailOtpModel.find(query).sort({ _id: -1 }).limit(3).exec();
        // if (otp?.length >= 3) return res.status(405).send({ message: errorMessages.tryIn24Hours })
        // if (otp?.length === 2 && moment().diff(moment(otp[0].createdAt), 'minutes') <= 60) return res.status(405).send({ message: errorMessages.tryIn60Minutes })
        // if (otp?.length === 1 && moment().diff(moment(otp[0].createdAt), 'minutes') <= 5) return res.status(405).send({ message: errorMessages.tryIn05Minutes })

        const otpCode = otpGenerator.generate(
            6,
            {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            }
        )
        console.log("profile email verification otp ===> ", otpCode)

        const otpCodeHash = await bcrypt.hash(otpCode, 12);

        await verifyEmailOtpModel.create({
            email: email?.trim()?.toLowerCase(),
            otpCodeHash: otpCodeHash,
        })

        // postmark
        // await sendEmailVerificationEmail(email?.trim()?.toLowerCase(), user?.firstName, otpCode)
        return res.send({ message: "verify email otp has sent" })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}

export const verifyProfileEmailCompleteController = async (req, res, next) => {
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

        const user = await userModel?.findOne({ email: email?.trim()?.toLowerCase(), _id: { $ne: req?.currentUser?._id } }).exec()
        if (user) {
            return res.status(404).send({
                message: errorMessages?.emailTaken
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

        const currentUser = await userModel.findOne({ _id: req?.currentUser?._id, isDeleted: false }).exec()
        if (!currentUser) return res.status(401).send({ message: errorMessages.unAuthError })

        currentUser.email = email
        currentUser.isEmailVerified = true
        await currentUser.save()
        return res.send({ message: "email verified and updated successfully" })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}