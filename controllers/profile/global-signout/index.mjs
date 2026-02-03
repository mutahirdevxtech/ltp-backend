import { isValidObjectId } from "mongoose";
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { loginHistoryModel } from "../../../models/index.mjs"

export const globalSignoutcontroller = async (req, res, next) => {
    try {
        const userId = req?.currentUser?._id
        const loginHistoryId = req?.currentUser?.loginHistoryId

        if (!userId || !isValidObjectId(userId) || !loginHistoryId || !isValidObjectId(loginHistoryId)) {
            return res.status(401).send({
                message: errorMessages.unAuthError
            })
        }
        await loginHistoryModel.updateMany(
            { _id: { $ne: loginHistoryId }, userId: userId },
            { $set: { isExpired: true } }
        )

        res.send({ message: "global signout done" })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}
