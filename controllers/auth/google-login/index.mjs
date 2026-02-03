import { errorMessages } from "../../../utils/errorMessages.mjs";
import { userModel } from "../../../models/index.mjs"
import { googleUserApi } from "../../../utils/core.mjs";
import { checkUserStatusUnAuth } from "../../../utils/functions.mjs";
import axios from "axios";

export const googleLoginController = async (req, res, next) => {
    try {
        const { accessToken } = req?.body

        if (!accessToken || accessToken?.trim() === "") {
            return res.status(400).send({
                message: errorMessages?.noAccessToken
            })
        }

        let googleUser = null

        try {
            googleUser = await axios.get(googleUserApi, { headers: { Authorization: `Bearer ${accessToken}` } });
        } catch (error) {
            console.error("facebook login error: ", error)
            return res.status(400).send({
                message: errorMessages?.tokenInvalid
            })
        }

        const user = await userModel?.findOne({ email: googleUser?.data?.email, isDeleted: false }).exec()

        if (!user) {
            const [firstName, ...lastNameParts] = googleUser?.data?.name?.split(" ");
            const lastName = lastNameParts.join(" ");

            const newUser = await userModel.create({
                firstName: firstName,
                lastName: lastName,
                email: googleUser?.data?.email,
                isEmailVerified: true,
            })
            const { password, ...userData } = newUser?.toObject()
            req.loginTokenPayload = userData
            req.source = "GOOGLE"
            next()

        } else {
            const { isValid, message } = checkUserStatusUnAuth(user?.status)
            if (!isValid) {
                return res.status(401).send({
                    message: message
                })
            }

            user.isEmailVerified = true
            await user.save()
            const { password, ...userData } = user?.toObject()
            req.loginTokenPayload = userData
            req.source = "GOOGLE"
            next()
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};