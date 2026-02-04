import { errorMessages } from "../../../utils/errorMessages.mjs";
import { bookingModel, userModel } from "../../../models/index.mjs";
import { isValidObjectId } from "mongoose";

export const createBookingController = async (req, res) => {
    try {
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
        } = req?.body

        if (!userId) {
            return res.status(400).send({
                message: errorMessages.unAuthError
            })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({
                message: errorMessages.invalidId
            })
        }
        if (!departurePort) {
            return res.status(400).send({
                message: "departure port is required"
            })
        }
        if (!destination) {
            return res.status(400).send({
                message: "destination is required"
            })
        }
        if (!departureDate || isNaN(new Date(departureDate).getTime())) {
            return res.status(400).send({
                message: "departure date must be a valid date"
            });
        }
        if (!stateroom) {
            return res.status(400).send({
                message: "stateroom is required"
            })
        }
        if (!type) {
            return res.status(400).send({
                message: "type is required"
            })
        }
        if (isNaN(Number(travellersAdults))) {
            return res.status(400).send({
                message: "travellers adults must be a number"
            })
        }
        if (isNaN(Number(travellersChildrens))) {
            return res.status(400).send({
                message: "travellers childrens must be a number"
            })
        }
        if (isNaN(Number(travellersInfants))) {
            return res.status(400).send({
                message: "travellers infants must be a number"
            })
        }
        if (Number(travellersAdults) + Number(travellersChildrens) + Number(travellersInfants) <= 0) {
            return res.status(400).send({
                message: "at least one traveller is required"
            });
        }
        if (Number(travellersAdults) < 0 || Number(travellersChildrens) < 0 || Number(travellersInfants) < 0) {
            return res.status(400).send({
                message: "travellers count cannot be negative"
            });
        }

        const isUserExist = await userModel.findById(userId).lean().exec()
        if (!isUserExist) {
            return res.status(400).send({
                message: "user account not found"
            });
        }

        const resp = await bookingModel.create({
            userId,
            departurePort,
            destination,
            departureDate,
            stateroom,
            type,
            travellersAdults: Number(travellersAdults),
            travellersChildrens: Number(travellersChildrens),
            travellersInfants: Number(travellersInfants),
            isDeleted: req?.currentUser?.role === "ADMIN" ? !!isDeleted : false,
        });

        return res.send({
            message: "booking created successfully",
            data: resp?.toObject()
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages.serverError,
            error: error.message
        });
    }
};
