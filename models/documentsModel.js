import mongoose from "mongoose";

const documentsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "page",
    },
    parentDocument: {
      type: String,
    },
    teamspace: {
      type: String,
    },
    type: {
      type: String,
    },
    favorites: {
      type: Array,
    },
    teamspaceId: {
      type: String,
    },
    content: {
      type: String,
    },
    description: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    icon: {
      type: String,
    },
    isPublished: {
      type: Boolean,
    },
    cloudinary_id: {
      type: String,
    },
    accessUsers: {
      // userId: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "user",
      // },
      email:{
        type:String
      },
      access: {
        type: String,
      },
    },
    memberAccess: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("document", documentsSchema);
