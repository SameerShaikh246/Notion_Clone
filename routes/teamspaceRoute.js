import express from "express";
import {
  createTeamspaceController,
  deleteTeamspaceController,
  getTeamspaceController,
  updateTeamspaceController,
  archiveTeamspaceController,
  membersController,
  getSharedDocuments,
  leaveTeamspaceController,
} from "../controllers/teamspaceController.js";
import upload from "../middlewares/multerMiddleware.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { removeArchiveDocumentController } from "../controllers/documentController.js";

//router object
const router = express.Router();

//routing

//route to create teamspace
router.post("/", upload.single("icon"), createTeamspaceController);
router.get("/", requireSignIn, getTeamspaceController);
router.delete("/:id", requireSignIn, deleteTeamspaceController);
router.post("/archive/:id", requireSignIn, archiveTeamspaceController);
router.post(
  "/remove-archive/:id",
  requireSignIn,
  removeArchiveDocumentController
);
//update documents routes
router.put(
  "/:id",
  upload.single("icon"),
  requireSignIn,
  updateTeamspaceController
);

//Member acess and share the document and teamspace
router.post("/members/:docId", requireSignIn, membersController);
router.get("/shared", requireSignIn, getSharedDocuments);
router.post("/leaveTeamspace/:docId", requireSignIn, leaveTeamspaceController);
router.post("");

export default router;
