import bcrypt from "bcrypt"
import { errorMessages } from "../../../utils/errorMessages.mjs";
import { userModel } from "../../../models/index.mjs"
import { emailPattern, firstNamePattern, lastNamePattern, passwordPattern } from "../../../utils/core.mjs"
// import { sendWelcomeEmail } from "../../../libs/postmark.mjs"

export const signupController = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password: reqPassword } = req.body;

        if (!firstName) return res.status(400).send({ message: errorMessages?.firstNameRequired });
        if (!firstNamePattern.test(firstName)) return res.status(400).send({ message: errorMessages?.firstNameInvalid });

        if (!lastName) return res.status(400).send({ message: errorMessages.lastNameRequired });
        if (!lastNamePattern.test(lastName)) return res.status(400).send({ message: errorMessages?.lastNameInvalid });

        if (!email) { return res.status(400).send({ message: errorMessages?.emailRequired }) }
        if (!emailPattern.test(email.toLowerCase())) return res.status(400).send({ message: errorMessages?.emailInvalid });

        if (!reqPassword) { return res.status(400).send({ message: errorMessages?.passwordRequired }) }
        if (!passwordPattern.test(reqPassword)) return res.status(400).send({ message: errorMessages?.passwordInvalid })

        const user = await userModel.findOne({ email: email?.toLowerCase(), isDeleted: false }).exec();
        if (user) {
            return res.status(400).send({
                message: errorMessages?.emailTaken
            });
        }

        const passwordHash = await bcrypt.hash(reqPassword, 12);

        await userModel.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: passwordHash
        })

        return res.send({
            message: "signup succesfull"
        })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        });
    }
};