import mongoose from "mongoose";
import { cruise_providers } from "../../utils/core.mjs"

// booking schema
let bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "users",
    },
    provider: {
        type: String,
        enum: cruise_providers,
        // required: true,
        trim: true,
    },
    ship: {
        type: String,
        // required: true,
        trim: true,
    },
    origin: {
        type: String,
        // required: true,
        trim: true,
        default: null,
        index: true,
    },
    destination: {
        type: String,
        // required: true,
        default: null,
        trim: true,
        index: true,
    },
    departureDate: {
        type: Date,
        default: null
        // required: true,
    },
    // stateroom: {
    //     type: String,
    //     required: true,
    //     trim: true,
    // },
    // type: {
    //     type: String,
    //     required: true,
    //     trim: true,
    // },
    travellersAdults: {
        type: Number,
        default: 0,
        min: 0,
    },
    travellersChildrens: {
        type: Number,
        default: 0,
        min: 0,
    },
    travellersInfants: {
        type: Number,
        default: 0,
        min: 0,
    },
    cruiseLink: {
        type: String,
        trim: true,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

let bookingModel;

try {
    bookingModel = mongoose.model('bookings');
} catch (error) {
    bookingModel = mongoose.model('bookings', bookingSchema);
}

export { bookingModel };
