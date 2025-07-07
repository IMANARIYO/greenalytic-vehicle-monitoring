import express from "express";
import passport from "passport";
import { tokengenerating } from "../utils/jwtFunctions";

const authRoutes = express.Router();

authRoutes.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRoutes.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    const user = req.user as any;

    if (!user) return res.redirect("/login");

    const token = tokengenerating({
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username || "",
    });
    return res.redirect(`/dashboard?token=${token}`);
  }
);



export default authRoutes;
