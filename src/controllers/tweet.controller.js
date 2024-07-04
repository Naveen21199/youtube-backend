import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body

    if (!content || !content?.trim() === '') {
        throw new ApiError(400, "Content is required")
    }


    //create tweet
    const tweet = await Tweet.create({
        owner: req.user._id,
        content,
    })

    if (!tweet) {
        throw new ApiError(404, "something is wrong with creating tweet")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet created successfully")
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw ApiError(400, "This user id not valid")
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweet = await Tweet.aggregate([
        {
            $match: {
                owner: user._id,
            }
        }
    ]);
    if (!tweet) {
        throw ApiError(404, "something went wrong while fetching tweets")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweets fetched successfully")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { newContent } = req.body

    //validating the id
    if (!isValidObjectId(tweetId)) {
        throw new ApiResponse(404, "Invalid tweet id")
    }

    if (!newContent || !newContent.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    //finding the tweet
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: newContent
            }
        },
        {
            new: true
        }
    )

    if (!updateTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateTweet, "Tweet updated")
        )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    //finding the tweet
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    //deleting the tweet
    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deleteTweet) {
        throw new ApiError(500, "Something went wrong while deleting tweet")
    }

    return res
        .status(200).
        json(
            new ApiResponse(200, deleteTweet, "tweet deleted")
        )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}