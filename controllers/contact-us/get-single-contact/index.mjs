import { errorMessages } from "../../../utils/errorMessages.mjs";
import { contactUsModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";

export const getSingleContactUsController = async (req, res) => {
    try {
        const { contactId } = req.params;

        // -----------------------------
        // Validations
        // -----------------------------
        if (!contactId) {
            return res.status(400).send({ message: errorMessages.idIsMissing });
        }

        if (!isValidObjectId(contactId)) {
            return res.status(400).send({ message: errorMessages.invalidId });
        }

        // -----------------------------
        // Fetch Contact
        // -----------------------------
        const contact = await contactUsModel
            .findById(contactId)
            .lean()
            .exec();

        if (!contact) {
            return res.status(404).send({ message: "contact request not found" });
        }

        return res.send({
            message: "contact request fetched successfully",
            data: contact
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};
