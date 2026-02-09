import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, cruiseModel, userModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";
import { cruise_providers } from "../../../utils/core.mjs";

export const updateBookingController = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const {
            userId,
            provider,
            ship,
            origin,
            destination,
            departureDate,
            stateroom,
            type,
            travellersAdults,
            travellersChildrens,
            travellersInfants,
            isDeleted,
        } = req.body;

        // --------------------
        // Validate bookingId
        // --------------------
        if (!bookingId) return res.status(400).send({ message: errorMessages.idIsMissing });
        if (!isValidObjectId(bookingId)) return res.status(400).send({ message: errorMessages.invalidId });

        const existingBooking = await bookingModel.findById(bookingId).lean().exec();
        if (!existingBooking) return res.status(404).send({ message: "booking not found" });

        // --------------------
        // Validate userId (if provided)
        // --------------------
        if (userId) {
            if (!isValidObjectId(userId)) return res.status(400).send({ message: errorMessages.invalidId });
            const isUserExist = await userModel.findById(userId).lean().exec();
            if (!isUserExist) return res.status(400).send({ message: "user account not found" });
        }

        // --------------------
        // Ship / Provider logic
        // --------------------
        let cruise_provider = provider ?? existingBooking.provider;

        if (ship || provider) {
            // if ship is updated, fetch provider if provider not provided
            if (!provider && ship) {
                const cruise = await cruiseModel.findOne({ ship }).lean().exec();
                if (!cruise) return res.status(400).send({ message: "cruise not found for this ship" });
                cruise_provider = cruise.provider;
            }

            if (!cruise_providers.includes(cruise_provider)) {
                return res.status(400).send({ message: "invalid provider" });
            }
        }

        // --------------------
        // Date validation
        // --------------------
        if (departureDate && isNaN(new Date(departureDate).getTime())) {
            return res.status(400).send({ message: "departure date must be a valid date" });
        }

        // --------------------
        // Travellers validation
        // --------------------
        const totalTravellers =
            Number(travellersAdults ?? existingBooking.travellersAdults) +
            Number(travellersChildrens ?? existingBooking.travellersChildrens) +
            Number(travellersInfants ?? existingBooking.travellersInfants);

        if (totalTravellers <= 0) return res.status(400).send({ message: "at least one traveller is required" });
        if (
            Number(travellersAdults ?? existingBooking.travellersAdults) < 0 ||
            Number(travellersChildrens ?? existingBooking.travellersChildrens) < 0 ||
            Number(travellersInfants ?? existingBooking.travellersInfants) < 0
        ) return res.status(400).send({ message: "travellers count cannot be negative" });

        // --------------------
        // Build update object
        // --------------------
        const updateObj = {};

        if (userId) updateObj.userId = userId;
        if (ship) updateObj.ship = ship;
        if (cruise_provider) updateObj.provider = cruise_provider;
        if (origin) updateObj.origin = origin;
        if (destination) updateObj.destination = destination;
        if (departureDate) updateObj.departureDate = new Date(departureDate);
        if (stateroom) updateObj.stateroom = stateroom;
        if (type) updateObj.type = type;
        if (travellersAdults !== undefined) updateObj.travellersAdults = Number(travellersAdults);
        if (travellersChildrens !== undefined) updateObj.travellersChildrens = Number(travellersChildrens);
        if (travellersInfants !== undefined) updateObj.travellersInfants = Number(travellersInfants);
        if (req?.currentUser?.role === "ADMIN" && isDeleted !== undefined) updateObj.isDeleted = !!isDeleted;

        // --------------------
        // Update booking
        // --------------------
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
        return res.status(500).send({ message: errorMessages.serverError, error: error.message });
    }
};
