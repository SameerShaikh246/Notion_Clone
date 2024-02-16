import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  getFavoriteDocumentsController,
  addFavoriteDocumentsController,
  deleteFavoriteDocumentsController,
  updateFavoriteDocumentsController,
} from "../controllers/favoritesController.js";

//router object
const router = express.Router();

//get favorite documents
router.get("/", requireSignIn, getFavoriteDocumentsController);

//add to favorites
router.post("/:id", requireSignIn, addFavoriteDocumentsController);

//remove from favorites
router.delete("/:id", requireSignIn, deleteFavoriteDocumentsController);

//update favorite documents
router.put("/:id", requireSignIn, updateFavoriteDocumentsController);

export default router;
