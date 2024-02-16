import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../utils/utils.js";
import JWT from "jsonwebtoken";
import nodemailer from "nodemailer";
import cloudinary from "../utils/cloudinary.js";
export const registerController = async (req, res) => {
  // console.log(req.body);
  try {
    console.log("here....", req.body);
    const { name, email, password, phone, address, role, answer } = req.body;
    //validation
    if (!name) {
      return res.send({
        error: "Name is required",
      });
    }
    if (!email) {
      return res.send({
        error: "Email is required",
      });
    }

    if (!password) {
      return res.send({
        error: "Password is required",
      });
    }
    if (!phone) {
      return res.send({
        error: "Phone number is required",
      });
    }

    //check user
    const existingUser = await userModel.findOne({ email });
    // existing user
    if (existingUser && existingUser.status === "Active") {
      return res.status(200).send({
        success: true,
        message: "User already exists",
      });
    }
    //register user
    const hashedPassword = await hashPassword(password);

    //save
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      role,
      answer,
      status: "Active",
    }).save();

    res
      .status(200)
      .send({ success: true, message: "User register successfully.", user });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while registering",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    // validation
    if (!email || !password) {
      res.status(404).send({
        success: false,
        message: "Invalid email or password.",
      });
    }
    // check user
    const user = await userModel
      .findOne({ email })
    if (!user || user?.status === "Deactive") {
      return res
        .status(404)
        .send({ success: false, message: "Email is not registered." });
    }

    let match = await comparePassword(password, user.password);

    if (!match) {
      return res
        .status(200)
        .send({ success: false, message: "Invalid password." });
    }

    //token
    const token = await JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    console.log("token: ", token, user);

    res.status(200).send({
      success: true,
      message: "Login successful.",
      user: user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while login",
      error,
    });
  }
};

export const loginControllerForGoogle = async (req, res) => {
  try {
    // console.log("login success", req.user);
    const user = await userModel
      .findOne({ email: req.user.email })
      .select("-createdAt -updatedAt -__v -password");
    // console.log("user", user);
    //token
    const token = await JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    // console.log("token: ", token, user);
    if (req.user) {
      res.status(200).json({
        success: true,
        message: "login success",
        user: user,
        token,
      });
    } else {
      res.status(400).json({
        message: "Not Authorized",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while login",
      error,
    });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel
      .findOne({ email })
      .select("-createdAt -updatedAt -__v -password");
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    //token
    const token = await JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
    console.log("EMAIL_NODEMAILER", process.env.EMAIL_NODEMAILER);
    console.log("PASS_NODEMAILER", process.env.PASS_NODEMAILER);
    var transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_NODEMAILER,
        pass: process.env.PASS_NODEMAILER,
      },
    });

    var mailOptions = {
      from: "syeddev9@gmail.com",
      to: email,
      subject: "Reset Password Link",
      html:
        '<p>Click <a href="http://localhost:5173/reset_password/' +
        user._id +
        "/" +
        token +
        '">here</a> to reset your password</p>',
    };
    // html: `<p>
    //     click
    //     <a href=http://localhost:5173/reset_password/${user._id}/${token}>
    //       here
    //     </a>
    //     to reset password.
    //   </p>`,

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        res.send({
          success: true,
          message: "Reset password link sent on your email.",
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while forgot password.",
      error,
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;
    console.log("id, token, password", id, token, password);
    const { err, decoded } = await JWT.verify(token, process.env.JWT_SECRET);
    if (err) {
      res.status(500).send({
        success: false,
        message: "token not valid.",
        error: err,
      });
    }

    //register user
    const hashedPassword = await hashPassword(password);

    //save
    const user = await userModel
      .findByIdAndUpdate(
        { _id: id },
        {
          password: hashedPassword,
        }
      )
      .select("-createdAt -updatedAt -__v -password");
    console.log("user", user);
    res.status(200).send({
      success: true,
      message: "User password reset successfully.",
      user,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while reset password.",
      error,
    });
  }
};

export const changedPasswordController = async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.user;
    const hashedPassword = await hashPassword(password);
    if (password?.length < 4) {
      res.status(404).send({
        success: false,
        message: "Invalid password, Password must be at least 4 characters.",
      });
    }
    //save
    const user = await userModel
      .findByIdAndUpdate(
        { _id: id },
        {
          password: hashedPassword,
        }
      )
      .select("-createdAt -updatedAt -__v -password");
    console.log("user", user);
    res.status(200).send({
      success: true,
      message: "User password reset successfully.",
      user,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while changing the password.",
      error,
    });
  }
};
