import { errorMessages } from "../../../utils/errorMessages.mjs"
import {
    cloudinaryProfilePicturesFolder,
    emailPattern,
    firstNamePattern,
    lastNamePattern,
    passwordPattern,
    rolesEnum,
    userStatusArray
} from "../../../utils/core.mjs"
import { userModel } from "../../../models/index.mjs"
import { uploadOnCloudinary } from "../../../libs/cloudinary.mjs"
import bcrypt from "bcrypt"

export const createSingleUserController = async (req, res, next) => {
    try {
        const { files } = req
        const {
            firstName,
            lastName,
            email,
            role,
            password: reqPassword,
            status,
            isDeleted,
            isEmailVerified,
        } = req.body

        // ===== Image validation =====
        if (!files || !files.length || !files[0]) {
            return res.status(400).send({ message: errorMessages?.profileImageRequired })
        }

        const file = files[0]
        if (!file.mimetype?.startsWith("image")) {
            return res.status(400).send({ message: errorMessages?.onlyImagesAllowed })
        }

        // ===== Basic required fields =====
        if (!firstName) return res.status(400).send({ message: errorMessages?.firstNameRequired })
        if (!lastName) return res.status(400).send({ message: errorMessages?.lastNameRequired })
        if (!email) return res.status(400).send({ message: errorMessages?.emailRequired })
        if (!role) return res.status(400).send({ message: errorMessages?.roleRequired })

        // ===== Patterns =====
        if (!firstNamePattern.test(firstName)) return res.status(400).send({ message: errorMessages?.firstNameInvalid })
        if (!lastNamePattern.test(lastName)) return res.status(400).send({ message: errorMessages?.lastNameInvalid })
        if (!emailPattern.test(email.toLowerCase())) return res.status(400).send({ message: errorMessages?.emailInvalid })
        if (!rolesEnum.includes(role.toUpperCase())) return res.status(400).send({ message: errorMessages?.invalidRole })

        if (reqPassword && !passwordPattern.test(reqPassword)) {
            return res.status(400).send({ message: errorMessages?.passwordInvalid })
        }

        if (status && !userStatusArray.includes(status.toUpperCase())) {
            return res.status(400).send({ message: errorMessages?.userStatusInvalid })
        }

        // ===== Check email already exists =====
        const userEmail = await userModel.findOne({ email: email.toLowerCase() }).exec()
        if (userEmail) {
            return res.status(400).send({ message: errorMessages?.emailTaken })
        }

        // ===== Upload image =====
        const imageResp = await uploadOnCloudinary(file, cloudinaryProfilePicturesFolder)
        const profileImageUrl = imageResp?.url

        // ===== Hash password if provided =====
        let passwordHash = null
        if (reqPassword) {
            passwordHash = await bcrypt.hash(reqPassword, 12)
        }

        // ===== Create user object (ONLY body fields) =====
        const user = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            role: role.toUpperCase(),
            profilePhoto: profileImageUrl,
            password: passwordHash,
            status: status ? status.toUpperCase() : "PENDING",
            isDeleted: isDeleted === "true",
            isEmailVerified: isEmailVerified === "true",
        }

        const userResp = await userModel.create(user)
        const { password, ...createdUser } = userResp.toObject()

        return res.send({ message: "user created", data: createdUser })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
