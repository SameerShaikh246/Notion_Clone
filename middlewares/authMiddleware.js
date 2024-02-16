import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// protected routes

export const requireSignIn = async (req, res, next) => {
  try {
    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    console.log("useruser decode", decode);
    req.user = decode;

    next();
  } catch (error) {
    console.log(error);
    res.send({ error: error });
  }
};

// admin access

export const requireAdmin = async (req, res, next) => {
  try {
    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    req.user = decode;
    const user = await userModel.findById(decode.id);
    if (user?.role !== "admin") {
      return res
        .status(401)
        .send({ success: false, message: "Unautorized access." });
      // return  res.status(200).send({ ok: false });
    } else {
      next();
    }
  } catch (error) {
    res.status(401).send({
      success: false,
      error,
      message: "Error in admin middelware",
    });
  }
};
