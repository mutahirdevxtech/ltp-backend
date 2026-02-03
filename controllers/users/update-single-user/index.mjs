import { errorMessages } from "../../../utils/errorMessages.mjs"
import { cloudinaryProfilePicturesFolder, emailPattern, firstNamePattern, lastNamePattern, passwordPattern, phoneNumberPattern, profilePictureSizeLimit, rolesEnum, userStatusArray } from "../../../utils/core.mjs"
import { userModel } from "../../../models/index.mjs"
import { deleteFromCloudinary, uploadOnCloudinary } from "../../../libs/cloudinary.mjs"
import { isValidObjectId } from "mongoose"
import bcrypt from "bcrypt"
// import { sendAccountActivationEmail } from "../../../libs/postmark.mjs"

export const updateSingleUserController = async (req, res, next) => {
    try {
        const { files } = req
        const { userId } = req?.params
        const {
            firstName, lastName,
            email, phoneNumber, phoneNumberHome, notes,
            isEmailVerified, password: reqPassword,
            isPhoneNumberVerified, isPhoneNumberHomeVerified, role,
            isDeleted, status, country, state, city, street, postalCode
        } = req?.body

        if (!userId) {
            return res.status(400).send({
                message: errorMessages?.idIsMissing
            })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({
                message: errorMessages?.invalidId
            })
        }

        if (firstName && !firstNamePattern.test(firstName)) return res.status(400).send({ message: errorMessages?.firstNameInvalid });
        if (lastName && !lastNamePattern.test(lastName)) return res.status(400).send({ message: errorMessages?.lastNameInvalid });
        if (email && !emailPattern.test(email.toLowerCase())) return res.status(400).send({ message: errorMessages?.emailInvalid });
        if (phoneNumber && !phoneNumberPattern.test(phoneNumber)) return res.status(400).send({ message: errorMessages?.phoneNumberInvalid });
        if (phoneNumberHome && !phoneNumberPattern.test(phoneNumberHome)) return res.status(400).send({ message: errorMessages?.phoneNumberHomeInvalid });
        if (role && !rolesEnum.includes(role.toUpperCase())) return res.status(400).send({ message: errorMessages?.invalidRole });
        if (status && !userStatusArray.includes(status?.toUpperCase())) return res.status(400).send({ message: errorMessages?.userStatusInvalid });
        if (reqPassword && !passwordPattern.test(reqPassword)) return res.status(400).send({ message: errorMessages?.passwordInvalid })

        const user = await userModel.findById(userId).exec()
        if (!user) {
            return res.status(404).send({
                message: errorMessages?.noAccountFound
            })
        }

        const oldStatus = user?.status
        var profileImageUrl = null
        var passwordHash = null

        if (files && files?.length && files[0]) {
            const file = files[0]
            if (!file?.mimetype?.startsWith("image")) return res.status(400).send({ message: errorMessages?.onlyImagesAllowed })
            if (!file?.size > profilePictureSizeLimit) return res.status(400).send({ message: errorMessages?.largeImage })
            await deleteFromCloudinary(user?.profilePhoto, cloudinaryProfilePicturesFolder)
            const imageResp = await uploadOnCloudinary(file, cloudinaryProfilePicturesFolder)
            profileImageUrl = await imageResp?.url
        }

        if (reqPassword) {
            const hash = await bcrypt.hash(reqPassword, 12)
            passwordHash = hash
        }

        let _address = {}
        if (country) _address.country = country
        if (state) _address.state = state
        if (city) _address.city = city
        if (postalCode) _address.postalCode = postalCode
        if (street) _address.street = street

        if (firstName) user.firstName = firstName
        if (lastName) user.lastName = lastName
        if (email) user.email = email
        if (phoneNumber) user.phoneNumber = phoneNumber
        if (phoneNumberHome) user.phoneNumberHome = phoneNumberHome
        if (role) user.role = role?.toUpperCase()
        if (profileImageUrl) user.profilePhoto = profileImageUrl
        if (isEmailVerified != null) user.isEmailVerified = isEmailVerified
        if (isPhoneNumberVerified != null) user.isPhoneNumberVerified = isPhoneNumberVerified
        if (isPhoneNumberHomeVerified != null) user.isPhoneNumberHomeVerified = isPhoneNumberHomeVerified
        if (isDeleted != null) user.isDeleted = isDeleted
        if (status) user.status = status
        if (notes) user.notes = notes
        if (reqPassword && passwordHash) user.password = passwordHash
        if (user?.address?.length) {
            user.address[0] = _address
        } else {
            user.address = [_address]
        }

        if (oldStatus?.toUpperCase() !== "ACTIVE" && status?.toUpperCase() === "ACTIVE") {
            // await sendAccountActivationEmail(user?.email, user?.firstName)
        }

        const resp = await user?.save()
        const { password, ...updatedUser } = resp?.toObject()

        return res.send({ message: "user updated", data: updatedUser })

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message
        })
    }
}
