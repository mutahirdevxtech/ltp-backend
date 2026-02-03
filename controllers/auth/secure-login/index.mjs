import { errorMessages } from "../../../utils/errorMessages.mjs";
import { loginHistoryModel, secureLoginOtpModel, userModel } from "../../../models/index.mjs"
import { emailPattern, passwordPattern } from "../../../utils/core.mjs"
import { checkUserStatusUnAuth } from "../../../utils/functions.mjs";
import bcrypt from "bcrypt"
import otpGenerator from "otp-generator"
import moment from "moment";
// import { sendSecureLoginOtpEmail } from "../../../libs/postmark.mjs";
// import { sendSingleMessage } from "../../../libs/twilio.mjs"

export const secureLoginController = async (req, res, next) => {
    try {
        const { email: key, password: reqPassword } = req.body;

        if (!key) {
            return res.status(400).send({
                message: errorMessages.emailRequired
            });
        }

        if (!emailPattern.test(key?.toLowerCase())) {
            return res.status(400).send({
                message: errorMessages.emailPasswordIncorrect
            });
        }

        if (!reqPassword) {
            return res.status(400).send({
                message: errorMessages?.passwordRequired
            });
        }

        if (!passwordPattern.test(reqPassword)) {
            return res.status(400).send({
                message: errorMessages?.emailPasswordIncorrect
            });
        }

        const user = await userModel.findOne({ email: key?.toLowerCase(), isDeleted: false }).exec();
        if (!user) {
            return res.status(400).send({
                message: errorMessages?.emailPasswordIncorrect
            });
        }

        if (!user.isEmailVerified) {
            return res.status(400).send({
                message: errorMessages?.emailNotVerified
            });
        }

        const { isValid, message } = checkUserStatusUnAuth(user?.status)
        if (!isValid) {
            return res.status(401).send({
                message: message
            })
        }
        if (!user?.password) {
            return res.status(500).send({
                message: errorMessages?.passwordNotSet
            })
        }

        const isPasswordTrue = await bcrypt.compare(reqPassword, user?.password);
        console.log("isPasswordTrue==> ", isPasswordTrue)
        if (!isPasswordTrue) {
            await loginHistoryModel.create({
                userId: user?._id,
                loginStatus: "INVALID_PASSWORD",
            })
            return res.status(400).send({
                message: errorMessages?.emailPasswordIncorrect
            });
        }

        const query = {
            email: user?.email?.toLowerCase(),
            createdAt: {
                $gte: moment().subtract(24, 'hours').toDate()
            }
        }

        const otp = await secureLoginOtpModel.find(query).sort({ _id: -1 }).limit(3).exec();

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

        console.log("secure login otp ====> ", otpCode)
        const otpCodeHash = await bcrypt.hash(otpCode, 12);

        await secureLoginOtpModel.create({
            email: user?.email?.trim()?.toLowerCase(),
            otpCodeHash: otpCodeHash,
        })

        // postmark
        // await sendSecureLoginOtpEmail(user?.email?.trim()?.toLowerCase(), user?.firstName, otpCode)
        // twilio sms send
        // const _message = `Hi ${user?.firstName}, your TNC LMS account's secure login OTP is: ${otpCode}. It is valid for 15 minutes.`;
        // await sendSingleMessage(phoneNumber?.trim(), message)
        return res.send({
            message: "otp code has sent, verify that its you",
            email: user?.email
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
