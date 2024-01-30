import mongoose, { isValidObjectId, mongo } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from './../models/video.model.js';


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if ([name, description].some((field) => field.trim() === '')) {
        throw new ApiError(404, "Please provide all fields")
    }

    const playList = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playList) {
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playList, "Successfully created playlist")
        )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const playLists = await Playlist.aggregate([
        // {
        //     $match: {
        //         owner: new mongoose.Types.ObjectId(userId)
        //     }
        // },
        // {
        //     $lookup: {
        //         from: "videos",
        //         localField: "videos",
        //         foreignField: "_id",
        //         as: "videos"
        //     }
        // },
        // {
        //     $addFields: {
        //         playList: {
        //             $first: "$videos",
        //         }
        //     }
        // }

        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "video_details"
            }
        },

        //this code is showing same vidoe twice 
        // {
        //     $addFields: {
        //         videos_details: {
        //             $first: "$video_details",
        //         }
        //     }
        // }
    ])

    if (!playLists) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playLists[0], "fetched user playslists")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playList = await Playlist.findById(playlistId)
    if (!playList) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playList, "video playlist fected by id")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const playList = await Playlist.findById(playlistId)
    if (!playList) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playList.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You do not have access to add video in the playlist")
    }

    const addToPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!addToPlayList) {
        throw new ApiError(500, "Internal server error ")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, addToPlayList, "Video added to playList successfully")
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const playList = await Playlist.findById(playlistId)
    if (!playList) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }


    if (playList.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You do not have access to remove video in the playlist")
    }

    const removeFromPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!removeFromPlayList) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, removeFromPlayList, "Video removed successfully from the playlist")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playList = await Playlist.findById(playlistId)

    if (!playList) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playList.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You do not have permission to delete this playlist")
    }

    const deletePlayList = await Playlist.findByIdAndDelete(playlistId)

    if (!playList) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletePlayList, "Playlist deleted successfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    // if (!((!name || name.trim() === "") || (!description || description.trim() === ""))) {
    //     throw new ApiError(400, "Name or description is required")
    // }

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name is required")
    }
    if (!description || description.trim() === "") {
        throw new ApiError(400, "description is required")
    }

    const playList = await Playlist.findById(playlistId)

    if (!playList) {
        throw new ApiError(400, "playlist not found")
    }

    if (playList.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You do not have permission to update the playlist")
    }

    const updatePlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if (!updatePlayList) {
        throw new ApiError(500, "Internal server error")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatePlayList, "Playlist updated successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}