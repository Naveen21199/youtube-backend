import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    //if it is a channel so it is already a user
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(400, "This channel does not exist")
    }
    let subscribe;
    let unsubscribe;

    const hasSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (hasSubscription) {
        // unsubscribe
        unsubscribe = await Subscription.findOneAndDelete(
            {
                subscriber: req.user._id,
                channel: channelId
            }
        )
        console.log(unsubscribe)
        if (!unsubscribe) {
            throw new ApiError(500, "Internal server error")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, unsubscribe, "Channel unsubscribed")
            )
    } else {
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        })
        if (!subscribe) {
            throw new ApiError(500, "Internal server error")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, subscribe, "channel subscribed")
            )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // const { channelId } = req.params
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const subscription = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $project: {
                subscribers: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                }
            }
        }

    ])
    return res
        .status(200)
        .json(
            new ApiResponse(200, subscription, "All user channel subscriptions fected")
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    const subcriptions = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel"
            }
        },
        {
            $project: {
                subscribedChannel: {
                    username: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, subcriptions[0], "All Subcribed channel fetched")
            // new ApiResponse(200, subcriptions, "All Subcribed channel fetched")
        )
})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}