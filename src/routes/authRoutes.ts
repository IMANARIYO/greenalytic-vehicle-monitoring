import express from "express";
import passport from "passport";
import UserController from "../controllers/UserController";

const authRoutes = express.Router();
const userController = new UserController();

authRoutes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  userController.googleAuth
);

export default authRoutes;
