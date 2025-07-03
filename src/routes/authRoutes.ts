import express from "express";
import passport from "passport";

const authRoutes = express.Router();

authRoutes.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRoutes.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: "/dashboard", 
  })
);


export default authRoutes;
