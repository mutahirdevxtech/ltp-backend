import { isValidObjectId } from "mongoose";
import { errorMessages } from "../../../utils/errorMessages.mjs";

export const getMyProfileController = async (req, res, next) => {
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

        req.userId = _id
        next()

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}

export const getOtherProfileController = async (req, res, next) => {
    try {
        const { userId } = req?.params

        if (!userId || userId?.trim() === "") {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        if (!isValidObjectId(userId)) {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        req.userId = userId
        next()

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
}