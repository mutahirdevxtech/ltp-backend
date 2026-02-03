import { errorMessages } from "../../../utils/errorMessages.mjs";
import { userModel } from "../../../models/index.mjs"
import { emailPattern } from "../../../utils/core.mjs";

export const is2FaEnabledController = async (req, res, next) => {
    try {
        const { email: key } = req?.query

        if (!key) {
            return res.status(400).send({ message: errorMessages.emailRequired })
        }

        if (!emailPattern.test(key?.toLowerCase())) {
            return res.status(400).send({ message: errorMessages.emailInvalid })
        }

        const user = await userModel?.findOne({ email: key?.toLowerCase(), isDeleted: false }).exec()
        if (!user) {
            return res.status(400).send({ message: errorMessages.emailPasswordIncorrect })
        }

        return res.send({
            message: "2fa fetched",
            is2FaEnabled: user?.is2faEnabled,
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};
