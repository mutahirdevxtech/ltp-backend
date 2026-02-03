import moment from "moment";
import otpGenerator from "otp-generator"
import bcrypt from "bcrypt"
import { userModel, verifyEmailOtpModel } from "../../../models/index.mjs";
import { emailPattern } from "../../../utils/core.mjs";
import { errorMessages } from "../../../utils/errorMessages.mjs";
// import { sendEmailVerificationEmail } from "../../../libs/postmark.mjs"

export const verifyEmailOtpController = async (req, res, next) => {
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

        const query = {
            email: user?.email?.toLowerCase(),
            createdAt: {
                $gte: moment().subtract(24, 'hours').toDate()
            }
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

        const otpCodeHash = await bcrypt.hash(otpCode, 12);
        console.log("verify-email-otp==> ", otpCode)

        await verifyEmailOtpModel.create({
            email: email?.trim()?.toLowerCase(),
            otpCodeHash: otpCodeHash,
        })

        // postmark
        // await sendEmailVerificationEmail(email?.trim()?.toLowerCase(), user?.firstName, otpCode)

        return res.send({ message: "email verification otp has sent" })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};