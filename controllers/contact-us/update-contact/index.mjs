import { errorMessages } from "../../../utils/errorMessages.mjs";
import { contactUsModel } from "../../../models/index.mjs";
import { emailPattern } from "../../../utils/core.mjs";
import { isValidObjectId } from "mongoose";

export const updateSingleContactUsController = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { title, message, fullName, email, isDeleted } = req.body;

        // -----------------------------
        // ID Validation
        // -----------------------------
        if (!contactId) {
            return res.status(400).send({ message: errorMessages.idIsMissing });
        }

        if (!isValidObjectId(contactId)) {
            return res.status(400).send({ message: errorMessages.invalidId });
        }

        // -----------------------------
        // Fetch Existing Entry
        // -----------------------------
        const contact = await contactUsModel.findById(contactId).exec();
        if (!contact) {
            return res.status(404).send({ message: "contact request not found" });
        }

        // -----------------------------
        // Field Validations
        // -----------------------------
        if (title !== undefined && typeof title !== "string")
            return res.status(400).send({ message: "title must be a string" });

        if (fullName !== undefined && typeof fullName !== "string")
            return res.status(400).send({ message: "fullName must be a string" });

        if (email !== undefined) {
            if (!emailPattern.test(email))
                return res.status(400).send({ message: "invalid email format" });
        }

        // -----------------------------
        // Update Fields
        // -----------------------------
        if (title !== undefined) contact.title = title;
        if (message !== undefined) contact.message = message || null;
        if (fullName !== undefined) contact.fullName = fullName;
        if (email !== undefined) contact.email = email.toLowerCase();
        if (isDeleted !== undefined)
            contact.isDeleted = isDeleted === true || isDeleted === "true";

        const updated = await contact.save();

        return res.send({
            message: "contact request updated successfully",
            data: updated.toObject()
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};
