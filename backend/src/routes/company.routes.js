import { Router } from "express";
import { registerCompany, getCompany, updateCompany, deleteCompany } from "../controllers/company.controller.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

router.post("/register",registerCompany); 
router.route("/:id")
    .get(verifyJWT, getCompany)
    .patch(verifyJWT, updateCompany)
    .delete(verifyJWT, deleteCompany);

export default router;
