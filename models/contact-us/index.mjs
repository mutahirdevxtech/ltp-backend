import { emailPattern } from "../../utils/core.mjs";
import mongoose from "mongoose";

const contactUsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        trim: true,
        default: null
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: emailPattern
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

contactUsSchema.pre("save", function(next) {
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});

let contactUsModel;

try {
    contactUsModel = mongoose.model("contact-us");
} catch (error) {
    contactUsModel = mongoose.model("contact-us", contactUsSchema);
}

export { contactUsModel };
