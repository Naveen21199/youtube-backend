import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const videoLike = await Like.findOne({
        video: videoId
    })

    let like;
    let unlike;

    if (videoLike) {
        unlike = await Like.deleteOne({
            video: videoId
        })
        if (!unlike) {
            throw new ApiError(500, "Internal server error")
        }
    } else {
        like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        if (!like) {
            throw new ApiError(500, "Internal server error")
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, `User ${like ? "Liked " : "Unlike"} video`)
        )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const commentLike = await Like.findOne(
        { comment: commentId }
    )

    let like;
    let unlike;

    if (commentLike) {
        unlike = await Like.deleteOne(
            { comment: commentLike }
        )
        if (!unlike) {
            throw new ApiError(500, "Internal server error")
        }
    } else {
        like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        if (!like) {
            throw new ApiError(500, "Internal server error")
        }
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, `User ${like ? "Liked " : "Unlike"} commnet`)
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweetLike = await Like.findOne({
        tweet: tweetId
    })

    let like;
    let unlike;

    if (tweetLike) {
        unlike = await Like.deleteOne({
            tweet: tweetLike
        })

        if (!unlike) {
            throw new ApiError(500, "Internal server error")
        }
    } else {
        like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        if (!like) {
            throw new ApiError(500, "Internal server error")
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, `User ${like ? "Liked " : "Unlike"} tweet`)
        )

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = await req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    // find user in database 
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const likes = await Like.aggregate([
        {
            $lookup: {
                from: "Video",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "videoOwner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoOwner: {
                    $arrayElemAt: ["$videoOwner", 0]
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiError(200, likes[2].likedVideos, "Fecthed liked videos")
        )


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}