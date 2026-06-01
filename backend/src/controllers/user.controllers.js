import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import crypto from "crypto"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
});

const getFrontendBaseUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";

const getBackendBaseUrl = () => process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 2610}`;

const getGoogleCallbackUrl = () =>
    process.env.GOOGLE_CALLBACK_URL || `${getBackendBaseUrl()}/api/v1/users/google/callback`;

const redirectToGoogleCallback = (res, params) => {
    const query = new URLSearchParams(params);
    return res.redirect(`${getFrontendBaseUrl()}/auth/google/callback?${query.toString()}`);
};

const createGoogleState = () =>
    jwt.sign(
        {
            provider: "google",
            createdAt: Date.now()
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "10m"
        }
    );

const verifyGoogleState = (state) => {
    if (!state) {
        return false;
    }

    try {
        const decodedState = jwt.verify(state, process.env.ACCESS_TOKEN_SECRET);
        return decodedState?.provider === "google";
    } catch {
        return false;
    }
};

const normalizeUsernameBase = (value = "") => {
    const cleanedValue = cleanString(value).toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleanedValue || "gigworlduser";
};

const generateUniqueUsername = async({ email, name }) => {
    const emailBase = email?.split("@")?.[0];
    const base = normalizeUsernameBase(emailBase || name);
    let candidate = base.slice(0, 24) || "gigworlduser";
    let suffix = 0;

    while (await User.exists({ username: candidate })) {
        suffix += 1;
        const suffixText = String(suffix);
        const baseLength = Math.max(1, 24 - suffixText.length);
        candidate = `${base.slice(0, baseLength)}${suffixText}`;
    }

    return candidate;
};

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if ([fullName, email, username, password].some((field) => !field || String(field).trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const user = await User.create({
        fullName,
        email, 
        password,
        username: username.toLowerCase(),
        authProvider: "password"
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    if (user.authProvider === "google") {
        throw new ApiError(401, "This account uses Google sign in. Continue with Google to access it.")
    }
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = getCookieOptions()

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const startGoogleAuth = asyncHandler(async(req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return redirectToGoogleCallback(res, {
            error: "Google sign in is not configured yet."
        });
    }

    const googleAuthParams = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: getGoogleCallbackUrl(),
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account",
        state: createGoogleState()
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${googleAuthParams.toString()}`);
});

const handleGoogleCallback = asyncHandler(async(req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return redirectToGoogleCallback(res, {
            error: "Google sign in was cancelled or denied."
        });
    }

    if (!code || !verifyGoogleState(state)) {
        return redirectToGoogleCallback(res, {
            error: "Google sign in could not be verified. Please try again."
        });
    }

    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: getGoogleCallbackUrl(),
                grant_type: "authorization_code"
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            return redirectToGoogleCallback(res, {
                error: "Google sign in failed while verifying your account."
            });
        }

        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const googleProfile = await profileResponse.json();

        if (!profileResponse.ok) {
            return redirectToGoogleCallback(res, {
                error: "Google profile could not be loaded."
            });
        }

        const googleId = cleanString(googleProfile.sub);
        const email = cleanString(googleProfile.email).toLowerCase();
        const fullName = cleanString(googleProfile.name) || cleanString(googleProfile.given_name) || "GigWorld member";

        if (!googleId || !email || googleProfile.email_verified === false) {
            return redirectToGoogleCallback(res, {
                error: "Google did not return a verified email address."
            });
        }

        let user = await User.findOne({ googleId });
        let isNewUser = false;

        if (!user) {
            user = await User.findOne({ email });

            if (user) {
                user.googleId = googleId;
                user.authProvider = user.authProvider === "password" ? "password_google" : "google";

                if (!user.fullName) {
                    user.fullName = fullName;
                }

                await user.save({ validateBeforeSave: false });
            } else {
                const username = await generateUniqueUsername({ email, name: fullName });
                user = await User.create({
                    fullName,
                    email,
                    username,
                    googleId,
                    authProvider: "google",
                    password: crypto.randomBytes(32).toString("hex")
                });
                isNewUser = true;
            }
        }

        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        const options = getCookieOptions()

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .redirect(
            `${getFrontendBaseUrl()}/auth/google/callback?${new URLSearchParams({
                accessToken,
                refreshToken,
                isNewUser: String(isNewUser),
                onboardingCompleted: String(Boolean(loggedInUser?.gigPreferences?.onboardingCompleted))
            }).toString()}`
        );
    } catch (callbackError) {
        console.error("Google auth callback error:", callbackError);
        return redirectToGoogleCallback(res, {
            error: "Google sign in is unavailable right now. Please try again."
        });
    }
});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = getCookieOptions()

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = getCookieOptions()
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    if (user.authProvider === "google") {
        throw new ApiError(400, "This account signs in with Google and does not have a password to change")
    }

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required")
    }

    const passwordRulesAreMet =
        newPassword.length >= 8 &&
        newPassword.length <= 16 &&
        /[A-Z]/.test(newPassword) &&
        /\d/.test(newPassword) &&
        /[^A-Za-z0-9\s]/.test(newPassword);

    if (!passwordRulesAreMet) {
        throw new ApiError(400, "New password must be 8-16 characters and include uppercase, number, and special character")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, phone, city, country, username} = req.body

    if (!cleanString(fullName)) {
        throw new ApiError(400, "Full name is required")
    }

    const existingUser = await User.findById(req.user?._id)

    if (!existingUser) {
        throw new ApiError(404, "User does not exist")
    }

    const updates = {
        fullName: cleanString(fullName),
        phone: cleanString(phone),
        city: cleanString(city),
        country: cleanString(country)
    };

    const nextUsername = cleanString(username).toLowerCase();

    if (nextUsername && nextUsername !== existingUser.username) {
        if (existingUser.authProvider !== "google") {
            throw new ApiError(403, "Username can only be changed for Google-created accounts")
        }

        if (!/^[a-z0-9]+$/.test(nextUsername)) {
            throw new ApiError(400, "Username can use only letters and numbers")
        }

        const usernameExists = await User.exists({
            _id: { $ne: existingUser._id },
            username: nextUsername
        });

        if (usernameExists) {
            throw new ApiError(409, "Username is already taken")
        }

        updates.username = nextUsername;
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updates
        },
        {new: true}
        
    ).select("-password -refreshToken -googleId")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated successfully"))
});

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const cleanStringArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(value.map((item) => cleanString(item)).filter(Boolean))];
};

const updateGigPreferences = asyncHandler(async(req, res) => {
    const {
        currentStatus,
        categories,
        skills,
        experienceLevel,
        workTypes,
        preferredSources,
        education,
        currentRole,
        workExperience,
        preferredBudget,
        languages,
        location,
        gender,
        age,
        onboardingCompleted
    } = req.body;

    const parsedAge = age === "" || age === undefined || age === null ? undefined : Number(age);

    if (parsedAge !== undefined && (Number.isNaN(parsedAge) || parsedAge < 13 || parsedAge > 100)) {
        throw new ApiError(400, "Age must be between 13 and 100");
    }

    const gigPreferences = {
        currentStatus: cleanString(currentStatus),
        categories: cleanStringArray(categories),
        skills: cleanStringArray(skills),
        experienceLevel: cleanString(experienceLevel),
        workTypes: cleanStringArray(workTypes),
        preferredSources: cleanStringArray(preferredSources),
        education: cleanString(education),
        currentRole: cleanString(currentRole),
        workExperience: cleanString(workExperience),
        preferredBudget: cleanString(preferredBudget),
        languages: cleanStringArray(languages),
        location: cleanString(location),
        gender: cleanString(gender),
        onboardingCompleted: Boolean(onboardingCompleted),
        updatedAt: new Date()
    };

    if (parsedAge !== undefined) {
        gigPreferences.age = parsedAge;
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                gigPreferences
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Gig preferences updated successfully"))
});

export {
    registerUser,
    loginUser,
    startGoogleAuth,
    handleGoogleCallback,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateGigPreferences,

}
