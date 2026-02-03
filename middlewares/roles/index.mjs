import { adminRoutes, userRoutes, unAuthRoutes } from "../../routes/index.mjs"
import { rolesEnum } from "../../utils/core.mjs"
import { errorMessages } from "../../utils/errorMessages.mjs"

export const rolesRoutesMiddleware = async (req, res, next) => {
    try {
        const { role } = req?.currentUser
        if (!role || !rolesEnum.includes(role)) {
            return res.status(401).send({
                message: errorMessages.unAuthError
            })
        }

        if (role === "ADMIN") { return adminRoutes(req, res, next) }
        else if (role === "CUSTOMER") { return userRoutes(req, res, next) }
        else { return unAuthRoutes(req, res, next) }

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
