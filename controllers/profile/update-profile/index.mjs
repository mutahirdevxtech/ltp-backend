import { isValidObjectId } from "mongoose"
import { errorMessages } from "../../../utils/errorMessages.mjs"
import { userModel } from "../../../models/index.mjs"
import { firstNamePattern, lastNamePattern, phoneNumberPattern } from "../../../utils/core.mjs"

export const updateProfileController = async (req, res, next) => {
    const { firstName, lastName, pushNotifications, is2faEnabled } = req?.body

    if (firstName && !firstNamePattern.test(firstName)) {
        return res.status(400).send({
            message: errorMessages?.firstNameInvalid
        })
    }

    if (lastName && !lastNamePattern.test(lastName)) {
        return res.status(400).send({
            message: errorMessages?.lastNameInvalid
        })
    }

    try {
        const { _id } = req?.currentUser

        if (!_id || _id?.trim() === "") {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        if (!isValidObjectId(_id)) {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        const user = await userModel.findById(_id, { password: 0 }).exec()
        if (!user) {
            return res.status(401).send({
                message: errorMessages.unAuthError
            })
        }

        if (firstName) user.firstName = firstName
        if (lastName) user.lastName = lastName
        if (pushNotifications != null) user.pushNotifications = (pushNotifications === true || pushNotifications === "true")
        if (is2faEnabled != null) user.is2faEnabled = (is2faEnabled === true || is2faEnabled === "true")

        const savedUser = await user.save()
        const { password, ...responseUser } = savedUser?.toObject()
        return res.send({ message: errorMessages?.profileUpdated, data: responseUser })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message,
        });
    }
}
