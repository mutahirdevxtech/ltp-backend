import { isValidObjectId } from "mongoose"
import { errorMessages } from "../../../utils/errorMessages.mjs"
import { cloudinaryProfilePicturesFolder, profilePictureSizeLimit } from "../../../utils/core.mjs"
import { userModel } from "../../../models/index.mjs"
import { deleteFromCloudinary, uploadOnCloudinary } from "../../../libs/cloudinary.mjs"
import { removeLocalFile } from "../../../utils/files.mjs"

export const updateProfilePictureController = async (req, res, next) => {
    try {
        const { files } = req
        const { _id } = req?.currentUser

        if (!_id || _id?.trim() === "") {
            removeLocalFile(files?.[0])
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        if (!isValidObjectId(_id)) {
            removeLocalFile(files?.[0])
            return res.status(401).send({
                message: errorMessages?.unAuthError
            })
        }

        if (!files || !files?.length || !files[0]) {
            removeLocalFile(files?.[0])
            return res.status(400).send({
                message: errorMessages?.noFileProvided
            })
        }

        const file = files[0]
        if (!file?.mimetype?.startsWith("image")) {
            removeLocalFile(files?.[0])
            return res.status(400).send({
                message: errorMessages?.onlyImagesAllowed
            })
        }

        if (file?.size > profilePictureSizeLimit) {
            removeLocalFile(files?.[0])
            return res.status(400).send({
                message: errorMessages?.largeImage
            })
        }

        const user = await userModel.findById(_id, { password: 0 }).exec()
        if (!user) {
            removeLocalFile(files?.[0])
            return res.status(401).send({
                message: errorMessages.unAuthError
            })
        }

        await deleteFromCloudinary(user?.profilePhoto, cloudinaryProfilePicturesFolder)
        const imageUploadResp = await uploadOnCloudinary(file, cloudinaryProfilePicturesFolder)

        user.profilePhoto = imageUploadResp?.url
        await user?.save()
        const respUser = user?.toObject()

        return res.send({ message: errorMessages?.profilePhotoUpdated, data: respUser })

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            message: errorMessages?.serverError,
            error: error?.message,
        });
    }
}