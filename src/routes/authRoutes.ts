import express from "express";
import passport from "passport";
import UserController from "../controllers/UserController";

const authRoutes = express.Router();
const userController = new UserController();

// Redirects to Google for authentication
authRoutes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback – now handled in the controller
authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login", // redirect to frontend
    session: false,
  }),
  userController.googleAuth
);

export default authRoutes;
