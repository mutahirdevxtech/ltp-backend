import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, cruiseModel, userModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";
import { cruise_providers } from "../../../utils/core.mjs";

export const createBookingController = async (req, res) => {
    try {
        const {
            userId,
            provider,
            ship,
            origin,
            destination,
            departureDate,
            stateroom,
            type,
            travellersAdults = 0,
            travellersChildrens = 0,
            travellersInfants = 0,
            isDeleted,
        } = req.body;

        // user check
        if (!userId) {
            return res.status(400).send({ message: errorMessages.unAuthError });
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ message: errorMessages.invalidId });
        }

        const isUserExist = await userModel.findById(userId).lean().exec();
        if (!isUserExist) {
            return res.status(400).send({ message: "user account not found" });
        }

        // ship
        if (!ship) {
            return res.status(400).send({ message: "ship is required" });
        }

        let cruise_provider = null;
        if (!provider || String(provider).trim() === "") {
            const cruise = await cruiseModel.findOne({ ship }).lean().exec();

            if (!cruise) {
                return res.status(400).send({ message: "cruise not found for this ship" });
            }

            cruise_provider = cruise.provider;
        } else {
            cruise_provider = provider;
        }

        // provider validation
        if (!cruise_providers.includes(cruise_provider)) {
            return res.status(400).send({ message: "invalid provider" });
        }

        // origin / destination
        if (!origin) {
            return res.status(400).send({ message: "origin is required" });
        }
        if (!destination) {
            return res.status(400).send({ message: "destination is required" });
        }

        // date
        if (!departureDate || isNaN(new Date(departureDate).getTime())) {
            return res.status(400).send({ message: "departure date must be a valid date" });
        }

        // stateroom / type
        if (!stateroom) {
            return res.status(400).send({ message: "stateroom is required" });
        }
        if (!type) {
            return res.status(400).send({ message: "type is required" });
        }

        // travellers validation
        if (isNaN(Number(travellersAdults)) || isNaN(Number(travellersChildrens)) || isNaN(Number(travellersInfants))) {
            return res.status(400).send({ message: "travellers counts must be numbers" });
        }

        const totalTravellers =
            Number(travellersAdults) + Number(travellersChildrens) + Number(travellersInfants);

        if (totalTravellers <= 0) {
            return res.status(400).send({ message: "at least one traveller is required" });
        }

        if (
            Number(travellersAdults) < 0 ||
            Number(travellersChildrens) < 0 ||
            Number(travellersInfants) < 0
        ) {
            return res.status(400).send({ message: "travellers count cannot be negative" });
        }

        // create booking
        const resp = await bookingModel.create({
            userId,
            provider: cruise_provider,
            ship,
            origin,
            destination,
            departureDate: new Date(departureDate),
            stateroom,
            type,
            travellersAdults: Number(travellersAdults),
            travellersChildrens: Number(travellersChildrens),
            travellersInfants: Number(travellersInfants),
            isDeleted: req?.currentUser?.role === "ADMIN" ? !!isDeleted : false,
        });

        return res.send({
            message: "booking created successfully",
            data: resp.toObject(),
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message,
        });
    }
};
