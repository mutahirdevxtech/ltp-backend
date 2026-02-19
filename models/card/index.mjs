import mongoose from "mongoose";

// card schema
let cardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "users",
    },
    cardNumber: {
        type: String,
        required: true,
    },
    cardCvv: {
        type: String,
        required: true,
    },
    cardExpiration: {
        type: String,
        required: true,
    },
    cardHolderName: {
        type: String,
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

let cardModel;

try {
    cardModel = mongoose.model('cards');
} catch (error) {
    cardModel = mongoose.model('cards', cardSchema);
}

export { cardModel };
