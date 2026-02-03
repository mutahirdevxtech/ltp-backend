import { isValidObjectId } from "mongoose"
import { errorMessages } from "../../../utils/errorMessages.mjs"
import { userModel } from "../../../models/index.mjs"
import { passwordPattern } from "../../../utils/core.mjs"
import bcrypt from "bcrypt"

export const updatePasswordController = async (req, res, next) => {
    const { oldPassword, newPassword } = req?.body

    if (!oldPassword) {
        return res.status(400).send({
            message: "old password is required"
        })
    }

    if (!passwordPattern.test(oldPassword)) {
        return res.status(400).send({
            message: "old password is invalid"
        })
    }

    if (!newPassword) {
        return res.status(400).send({
            message: "new password is required"
        })
    }

    if (!passwordPattern.test(newPassword)) {
        return res.status(400).send({
            message: `new ${errorMessages.passwordInvalid}`
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

        const user = await userModel.findById(_id).exec()
        if (!user) {
            return res.status(401).send({
                message: errorMessages.unAuthError
            })
        }

        if (user.password) {
            const isValid = await bcrypt.compare(oldPassword, user?.password)
            if (!isValid) {
                return res.status(401).send({
                    message: "old password is invalid"
                })
            }
        }

        const passwordHash = await bcrypt.hash(newPassword, 12)
        user.password = passwordHash
        await user.save()
        return res.send({ message: "password updated" })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message,
        });
    }
}
