import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { Video } from './../models/video.model.js';
import mongoose, { isValidObjectId } from "mongoose"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = `/^video/`, sortBy = "createdAt", sortType = 1, userId = req.user._id } = req.query
    //TODO: get all videos based on query, sort, pagination
    const user = await User.findById({
        _id: userId
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const allVideos = await Video.aggregate([
        {
            $match: {
                videoOwner: new mongoose.Types.ObjectId(userId),
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                ]
            }
        },
        {
            $sort: {
                [sortBy]: sortType
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    Video.aggregatePaginate(allVideos, { page, limit })
        .then((result) => {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, result, "Fetched all videos")
                )
        })
        .catch((error) => {
            console.log("Error while fetching videos")
            throw error
        })
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (
        [title, description].some((field) => field?.trim() === '')
    ) {
        throw ApiError(400, "All fields are required")
    }


    const videoLocalPath = req.files?.videoFile[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const duration = await videoFile.duration

    if (!videoFile) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail?.url || "",
        owner: req.user?._id,
        title,
        description,
        duration,
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while saving the video")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, video, "Video uploaded successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found with this id")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id")
    }

    const { title, description } = req.body
    const thumbnail = req.file?.path

    // if any of them are not provided
    if (!thumbnail || (!title || title.trim === "") || (!description || description.trim === "")) {
        throw new ApiError(400, "While updating fields are required")
    }

    // finding video in database 
    const previousVideo = await Video.findById(videoId)
    if (!previousVideo) {
        throw new ApiError(404, "Video not found ")
    }

    let updateFields = {
        $set: {
            title,
            description,
        },
    };

    // if thumbnail provided then delete the last one and replace with new one 
    if (thumbnail) {
        //getting the pubilc id 
        const result = new URL(previousVideo.thumbnail).pathname.split("/").pop();
        const public_id = result.split(".")[0]
        await deleteOnCloudinary(public_id, "image")

        // await deleteOnCloudinary(public_id)

        // updating the thumbnail 
        const newThumbnail = await uploadOnCloudinary(thumbnail)

        if (!newThumbnail) {
            throw new ApiError(500, "Errow occured while uploading thumbnail")
        }

        Object.assign(updateFields.$set, {
            public_id: newThumbnail.public_id,
            url: newThumbnail.url,
        });
    }
    const updatedVideo = await Video.findOneAndUpdate(
        { _id: videoId },
        updateFields,
        { new: true }
    )
    if (!updatedVideo) {
        throw new ApiError(404, "something went wrong while updating video")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video details updated successfully")
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, " Video not found")
    }

    if (video.videoFile) {
        const result = new URL(video.videoFile).pathname.split("/").pop();
        const public_id = result.split(".")[0]
        await deleteOnCloudinary(public_id, "video")
    }
    if (video.thumbnail) {
        const result = new URL(video.thumbnail).pathname.split("/").pop();
        const public_id = result.split(".")[0]

        await deleteOnCloudinary(public_id, "image")
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if (!deleteVideo) {
        throw new ApiError(500, "Something went wrong while deleting video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video deleted successfully")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid video id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found');
    }

    if (video.owner.toString !== req.user._id.toString()) {
        throw new ApiResponse(400, "You do not have access to toggle this video")
    }
    // Toggle the isPublished field
    video.isPublished = !video.isPublished;

    // Save the updated document
    const updatedVideo = await video.save({ validatebeforesave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video updated successfully")
        )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}