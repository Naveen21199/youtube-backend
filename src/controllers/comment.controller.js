import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from './../models/video.model.js';

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Video.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        }
    ])

    Comment.aggregatePaginate(comment,
        {
            page,
            limit
        }
    )
        .then((result) => {
            return res.status(201).json(
                new ApiResponse(200, result, "Tweet Comments fetched"))
        })
        .catch((error) => {
            throw new ApiError(500, "something went wrong while fetching Tweet Comments",)
        })

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }


    const { content } = req.body

    if (!content || !content.trim() === "") {
        throw new ApiError(400, "Please provide the fields")
    }

    const videoCommnet = await Comment.create({
        content,
        videoId,
        owner: req.user._id
    })

    if (!videoCommnet) {
        throw new ApiResponse(500, "something went wrong while creating comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoCommnet, "Comment Added successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { newContent } = req.body
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: newContent
            }
        },
        {
            new: true
        }
    )

    if (!updateComment) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateComment, "Comment updated")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)
    if (!deleteComment) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deleteComment, "Comment deleted")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}