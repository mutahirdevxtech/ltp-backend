import mongoose from "mongoose";

// booking schema
let bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "users",
    },
    departurePort: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    destination: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    departureDate: {
        type: Date,
        required: true,
    },
    stateroom: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        trim: true,
    },
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
