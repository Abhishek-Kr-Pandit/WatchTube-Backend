import {asyncHandler} from "../utils/asyncHandler.js"; 
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { response } from "express";



const registerUser=asyncHandler(async (req,res)=>{
    /*
    1.get user details from frontend
    2.validation-not empty
    3.check if user already exists:username and with email
    4.check for images,check for avatar
    5.upload them to cloudinary
    6.create user object-create entry in db
    7.remove password and refresh token field from response
    8.check for user creation
    9.return response
    */

    const {fullname,email,username,password}=req.body
    console.log("email",email);
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"All field are required")
    }

    const existedUser=User.findOne({
        $or:[{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Failed to upload avatar")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url,//if there is coverImage then extract url else remain empty
        email,
        username:username.toLowerCase(),
        password
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user");
        
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
        
    )


})



export {registerUser}