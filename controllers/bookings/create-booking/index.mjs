import { errorMessages } from "../../../utils/errorMessages.mjs";
import { contactUsModel } from "../../../models/index.mjs";
import { emailPattern } from "../../../utils/core.mjs";

export const createBookingController = async (req, res) => {
    try {
        const { title, message, fullName, email, isDeleted } = req.body;
        const currentUser = req?.currentUser

        // -----------------------------
        // Required Validations
        // -----------------------------
        if (!title)
            return res.status(400).send({ message: "title is required" });

        if (!fullName)
            return res.status(400).send({ message: "fullName is required" });

        if (!email)
            return res.status(400).send({ message: "email is required" });

        if (!emailPattern.test(email))
            return res.status(400).send({ message: "invalid email format" });

        // -----------------------------
        // Create Contact Us Entry
        // -----------------------------
        const resp = await contactUsModel.create({
            title,
            message: message || null,
            fullName,
            email: email.toLowerCase(),
            isDeleted: currentUser?.role === "ADMIN" ? (isDeleted === true || isDeleted === "true") : false
        });

        return res.send({
            message: "contact request submitted successfully",
            data: resp.toObject()
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};
