import { errorMessages } from "../../../utils/errorMessages.mjs"
import { userModel } from "../../../models/index.mjs"
import { isValidObjectId } from "mongoose"

export const getSingleUserController = async (req, res, next) => {
    try {
        const { userId } = req?.params
        if (!userId) {
            return res.status(400).send({ message: errorMessages?.idIsMissing })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ message: errorMessages?.invalidId })
        }

        const user = await userModel.findById(userId).exec()
        if (!user) {
            return res.status(404).send({ message: errorMessages?.noAccountFound })
        }
        const { password, ...user_data } = user.toObject()
        return res.send({
            message: "user fetched successfully",
            data: user_data
        })
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}