import express from "express";
import {
  registerController,
  loginController,
  loginControllerForGoogle,
  forgotPasswordController,
  resetPasswordController,
  changedPasswordController,
} from "../controllers/authController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

//router object
const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);

//LOGIN || METHOD POST
router.post("/login", loginController);

//LOGIN WITH GOOGLE need to check with front-end
router.get("/login/sucess", loginControllerForGoogle);

//to logout the google sesion
router.get("/logout", (req, res) => {
  // Code to handle user logout
  res.redirect("http://localhost:5173/login");
});

router.post("/forgot-password", forgotPasswordController);

router.post("/reset-password/:id/:token", resetPasswordController);
router.post("/changed-password", requireSignIn, changedPasswordController);

//protected User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

export default router;
