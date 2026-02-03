import jwt from "jsonwebtoken"
import { errorMessages } from "../../utils/errorMessages.mjs"
import { extendedSessionInDays, initialSessionInDays } from "../../utils/core.mjs"
import { isValidObjectId } from "mongoose"
import { loginHistoryModel, userModel } from "../../models/index.mjs"
import { checkUserStatusUnAuth } from "../../utils/functions.mjs"

export const authenticationMiddleware = async (req, res, next) => {
    try {
        const { hart } = req?.cookies
        if (!hart) {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }
        const currentUser = jwt?.verify(hart, process.env.JWT_KEY)
        if (!currentUser) {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        const loginHistoryId = currentUser?.loginHistoryId
        if (!loginHistoryId || !isValidObjectId(loginHistoryId)) {
            return res.status(401).send({ message: errorMessages.unAuthError })
        }

        const history = await loginHistoryModel.findOne({ _id: loginHistoryId })
        if (!history) {
            return res.status(401).send({ message: errorMessages.unAuthError })
        }
        if (history.isExpired) {
            return res.status(401).send({ message: errorMessages.sessionExpired })
        }

        req.currentUser = currentUser
        next()
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}

export const issueLoginToken = async (req, res, next) => {
    try {
        const { loginTokenPayload } = req
        if (!loginTokenPayload) {
            return res.status(400).send({
                message: errorMessages.noTokenPayload
            })
        }

        var historyResp = await loginHistoryModel.create({
            loginStatus: "SUCCESSFULL",
            userId: loginTokenPayload?._id,
            source: req?.source
        })

        const hart = jwt?.sign({ ...loginTokenPayload, loginHistoryId: historyResp?._id }, process.env.JWT_KEY, { expiresIn: `${initialSessionInDays}d` })
        const hartRef = jwt?.sign({ ...loginTokenPayload, loginHistoryId: historyResp?._id }, process.env.JWT_KEY, { expiresIn: `${extendedSessionInDays}d` })

        res.cookie('hart', hart, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(Date.now() + initialSessionInDays * 24 * 60 * 60 * 1000)
        });

        res.cookie('hartRef', hartRef, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(Date.now() + extendedSessionInDays * 24 * 60 * 60 * 1000)
        });

        historyResp.session = hart
        await historyResp.save()

        next()
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}

export const activeAccountMiddleware = async (req, res, next) => {
    try {
        const { _id } = req?.currentUser
        if (!_id) {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }
        if (!isValidObjectId) {
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }
        const user = await userModel.findById(_id).exec()
        if (!user || user?.isDeleted) {
            return res.status(404).send({
                message: errorMessages?.noAccountFound
            })
        }
        const { isValid, message } = checkUserStatusUnAuth(user?.status)
        if (!isValid) {
            return res.status(401).send({
                message: message
            })
        }
        next()
    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
