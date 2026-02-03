import { errorMessages } from "../../../utils/errorMessages.mjs";
import { userModel } from "../../../models/index.mjs"
import { facebookUserApi } from "../../../utils/core.mjs";
import axios from "axios";
import { checkUserStatusUnAuth } from "../../../utils/functions.mjs";

export const facebookLoginController = async (req, res, next) => {
    try {
        const { accessToken } = req?.body
        if (!accessToken || accessToken?.trim() === "") {
            return res.status(400).send({
                message: errorMessages?.noAccessToken
            })
        }

        let facebookUser = null

        try {
            facebookUser = await axios.get(`${facebookUserApi}${accessToken}`);
        } catch (error) {
            console.error("facebook login error: ", error)
            return res.status(400).send({
                message: errorMessages?.tokenInvalid
            })
        }

        if (!facebookUser?.email) {
            return res.status(400).send({
                message: errorMessages?.facebookEmailPermissionError
            })
        }
        const user = await userModel?.findOne({ email: facebookUser?.email, isDeleted: false }).exec()
        if (!user) {
            const newUser = await userModel.create({
                firstName: facebookUser?.first_name,
                lastName: facebookUser?.last_name,
                email: facebookUser?.email,
            })
            const { password, ...userData } = newUser?.toObject()
            req.loginTokenPayload = userData
            req.source = "FACEBOOK"
            next()

        } else {
            const { isValid, message } = checkUserStatusUnAuth(user?.status)

            if (!isValid) {
                return res.status(401).send({
                    message: message
                })
            }

            const { password, ...userData } = user?.toObject()
            req.loginTokenPayload = userData
            req.source = "FACEBOOK"
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


// {
//     "id": "facebook userID",
//     "first_name": "Abdul",
//     "last_name": "Ahad",
//     "email": "ahad@gmail.com",
//     "picture": {
//         "data": {
//             "height": 50,
//             "is_silhouette": false,
//             "url": "profile image url",
//             "width": 50
//         }
//     }
// }