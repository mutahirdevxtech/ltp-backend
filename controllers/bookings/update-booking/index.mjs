import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, userModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";

export const updateBookingController = async (req, res) => {
    try {
        const { bookingId } = req?.params;

        const {
            userId,
            departurePort,
            destination,
            departureDate,
            stateroom,
            type,
            travellersAdults,
            travellersChildrens,
            travellersInfants,
            isDeleted,
        } = req?.body;

        // --------------------
        // Validate bookingId
        // --------------------
        if (!bookingId) {
            return res.status(400).send({
                message: errorMessages.idIsMissing,
            });
        }

        if (!isValidObjectId(bookingId)) {
            return res.status(400).send({
                message: errorMessages.invalidId,
            });
        }

        // --------------------
        // Check booking exists
        // --------------------
        const existingBooking = await bookingModel.findById(bookingId).lean().exec();
        if (!existingBooking) {
            return res.status(404).send({
                message: "booking not found",
            });
        }

        // --------------------
        // Validate userId (if provided)
        // --------------------
        if (userId) {
            if (!isValidObjectId(userId)) {
                return res.status(400).send({
                    message: errorMessages.invalidId,
                });
            }

            const isUserExist = await userModel.findById(userId).lean().exec();
            if (!isUserExist) {
                return res.status(400).send({
                    message: "user account not found",
                });
            }
        }

        // --------------------
        // Validate fields (if provided)
        // --------------------
        if (departureDate && isNaN(new Date(departureDate).getTime())) {
            return res.status(400).send({
                message: "departure date must be a valid date",
            });
        }

        if (travellersAdults !== undefined && isNaN(Number(travellersAdults))) {
            return res.status(400).send({
                message: "travellers adults must be a number",
            });
        }

        if (travellersChildrens !== undefined && isNaN(Number(travellersChildrens))) {
            return res.status(400).send({
                message: "travellers childrens must be a number",
            });
        }

        if (travellersInfants !== undefined && isNaN(Number(travellersInfants))) {
            return res.status(400).send({
                message: "travellers infants must be a number",
            });
        }

        const totalTravellers =
            Number(travellersAdults ?? existingBooking.travellersAdults) +
            Number(travellersChildrens ?? existingBooking.travellersChildrens) +
            Number(travellersInfants ?? existingBooking.travellersInfants);

        if (totalTravellers <= 0) {
            return res.status(400).send({
                message: "at least one traveller is required",
            });
        }

        if (
            Number(travellersAdults ?? existingBooking.travellersAdults) < 0 ||
            Number(travellersChildrens ?? existingBooking.travellersChildrens) < 0 ||
            Number(travellersInfants ?? existingBooking.travellersInfants) < 0
        ) {
            return res.status(400).send({
                message: "travellers count cannot be negative",
            });
        }

        // --------------------
        // Build update object
        // --------------------
        const updateObj = {};

        if (userId) updateObj.userId = userId;
        if (departurePort) updateObj.departurePort = departurePort;
        if (destination) updateObj.destination = destination;
        if (departureDate) updateObj.departureDate = departureDate;
        if (stateroom) updateObj.stateroom = stateroom;
        if (type) updateObj.type = type;

        if (travellersAdults !== undefined) updateObj.travellersAdults = Number(travellersAdults);
        if (travellersChildrens !== undefined) updateObj.travellersChildrens = Number(travellersChildrens);
        if (travellersInfants !== undefined) updateObj.travellersInfants = Number(travellersInfants);

        // Only ADMIN can update isDeleted
        if (req?.currentUser?.role === "ADMIN" && isDeleted !== undefined) {
            updateObj.isDeleted = !!isDeleted;
        }

        const updatedBooking = await bookingModel.findByIdAndUpdate(
            bookingId,
            { $set: updateObj },
            { new: true }
        ).lean().exec();

        return res.send({
            message: "booking updated successfully",
            data: updatedBooking,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message,
        });
    }
};
