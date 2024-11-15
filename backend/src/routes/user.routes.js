import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 

    updateAccountDetails
} from "../controllers/user.controllers.js";

import { verifyJWT } from "../middlewares/auth.js";


const router = Router()

router.route("/register").post( registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
//router.route("/forgot-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").put(verifyJWT, updateAccountDetails)


export default router