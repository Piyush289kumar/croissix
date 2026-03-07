import { Router } from "express";
import { linkGoogleAccount, login, logout, register } from "../controllers/auth.controller.js";
import { ensureAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/link-google", ensureAuth, linkGoogleAccount);
router.post("/logout", ensureAuth, logout);

export default router;
