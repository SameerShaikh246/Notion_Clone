import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    logo: {
      type: String,
    },
    icon: {
      type: String,
    },
    title: {
      type: String,
      default:"Notion App"
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    answer: {
      type: String,
      default: "Please enter your answer",
    },
    role: {
      type: String,
      default: "User",
    },
    googleId: {
      type: String,
    },
    cloudinary_id: {
      type: String,
    },
    status: {
      type: String,
      default: "Active",
    },
    theme: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("users", userSchema);
