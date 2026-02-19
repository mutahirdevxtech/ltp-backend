import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, cruiseModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";
import { cruise_providers } from "../../../utils/core.mjs";

export const updateBookingController = async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!bookingId) return res.status(400).json({ message: errorMessages.idIsMissing });
        if (!isValidObjectId(bookingId)) return res.status(400).json({ message: errorMessages.invalidId });

        const existingBooking = await bookingModel.findById(bookingId).lean().exec();
        if (!existingBooking) return res.status(404).json({ message: "booking not found" });

        const {
            provider,
            ship,
            origin,
            destination,
            departureDate,
            travellersAdults,
            travellersChildrens,
            travellersInfants,
            cruiseId,
            isDeleted,
            lastBookingDate,
        } = req.body;

        // -------------------- Cruise Provider --------------------
        let cruise_provider = provider?.trim() || existingBooking.provider;
        if (ship && !provider) {
            const cruise = await cruiseModel.findOne({ ship: ship.trim() }).lean().exec();
            if (cruise) cruise_provider = cruise.provider;
        }
        if (cruise_provider && !cruise_providers.includes(cruise_provider)) {
            return res.status(400).json({ message: "invalid provider" });
        }

        // -------------------- Departure Date --------------------
        let departure = existingBooking.departureDate;
        if (departureDate) {
            const parsedDate = new Date(departureDate);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: "departure date must be a valid date" });
            }
            departure = parsedDate;
        }

        // -------------------- Travellers Validation --------------------
        const adults = travellersAdults !== undefined ? Number(travellersAdults) : existingBooking.travellersAdults;
        const children = travellersChildrens !== undefined ? Number(travellersChildrens) : existingBooking.travellersChildrens;
        const infants = travellersInfants !== undefined ? Number(travellersInfants) : existingBooking.travellersInfants;

        if ([adults, children, infants].some(isNaN)) {
            return res.status(400).json({ message: "travellers counts must be numbers" });
        }
        if ([adults, children, infants].some(n => n < 0)) {
            return res.status(400).json({ message: "travellers count cannot be negative" });
        }
        if (adults + children + infants <= 0) {
            return res.status(400).json({ message: "at least one traveller is required" });
        }

        // -------------------- Cruise Link --------------------
        let cruise_link = existingBooking.cruiseLink;
        if (cruiseId && isValidObjectId(cruiseId)) {
            const cruise = await cruiseModel.findById(cruiseId).lean().exec();
            if (cruise) cruise_link = cruise.link;
        }

        // -------------------- Build Update Object --------------------
        const updateObj = {
            provider: cruise_provider,
            ship: ship?.trim() || existingBooking.ship,
            origin: origin?.trim() || existingBooking.origin,
            destination: destination?.trim() || existingBooking.destination,
            departureDate: departure,
            travellersAdults: adults,
            travellersChildrens: children,
            travellersInfants: infants,
            cruiseLink: cruise_link,
            lastBookingDate: lastBookingDate ? new Date(lastBookingDate) : existingBooking.lastBookingDate,
        };

        // Only admins can update isDeleted
        if (req?.currentUser?.role === "ADMIN" && isDeleted !== undefined) {
            updateObj.isDeleted = !!isDeleted;
        }

        // -------------------- Update Booking --------------------
        const updatedBooking = await bookingModel.findByIdAndUpdate(
            bookingId,
            { $set: updateObj },
            { new: true }
        ).lean().exec();

        return res.json({
            message: "booking updated successfully",
            data: updatedBooking,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: errorMessages.serverError, error: error.message });
    }
};
