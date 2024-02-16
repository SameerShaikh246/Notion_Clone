import documentsModel from "../models/documentsModel.js";

export const getFavoriteDocumentsController = async (req, res) => {
  try {
    const id = req.user.id;

    const documents = await documentsModel
      .find({
        type: "favorite",
        favorites: { $in: [id] },
      })
      .select("-__v");

    res.status(200).send({
      success: true,
      message: "favorite documents fetched successfully",
      data: documents,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the favorite document",
    });
  }
};
export const addFavoriteDocumentsController = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const doc = await documentsModel.findById(id);

    if (doc?.type === "teamspace") {
      return res.status(404).send({
        success: false,
        message: "teamspace is unable to add in the favorite document.",
      });
    }
    if (doc?.favorites?.includes(doc.userId)) {
      return res.status(404).send({
        success: false,
        message: "Document already added to the favorite document.",
      });
    }

    if (!doc) {
      return res.status(404).send({
        success: false,
        message: "Document not found.",
      });
    }

    //query to add userId in the favorites array of the docment
    let newDoc = await documentsModel.findByIdAndUpdate(id, {
      type: "favorite",
      $push: { favorites: userId },
    });
    res.status(200).send({
      success: true,
      message: "Document is added to the favorites list.",
      data: newDoc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while adding to the favorite document.",
    });
  }
};

export const deleteFavoriteDocumentsController = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const doc = await documentsModel.findById(id);
    if (!doc) {
      return res.status(404).send({
        success: false,
        message: "Document not found.",
      });
    }
    //query to remove userId in the favorites array of the docment
    let newDoc = await documentsModel.findByIdAndUpdate(id, {
      type: "favorite",
      $pull: { favorites: userId },
    });
    res.status(200).send({
      success: true,
      message: "Document is removed from the favorites list.",
      data: newDoc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while removing from the favorite document.",
    });
  }
};

export const updateFavoriteDocumentsController = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const parentDocument = req.body.parentDocument;
    const doc = await documentsModel.findById(id);
    if (!doc) {
      return res.status(404).send({
        success: false,
        message: "Document not found.",
      });
    }
    if (!parentDocument) {
      return res.status(404).send({
        success: false,
        message: "teamspace Id not found.",
      });
    }
    console.log("userid", userId, doc.userId, parentDocument);
    if (doc.userId !== userId) {
      return res.status(404).send({
        success: false,
        message:
          "unable to move from the favorite document to teamspace, authorization failed.",
      });
    }
    const data = await documentsModel.findByIdAndUpdate(
      id,
      {
        parentDocument: parentDocument,
        type: "favorite",
        $pull: { favorites: userId },
        // here we are removing userId from the favorites array for perticular user only
      },
      {
        new: true,
      }
    );
    res.status(200).send({
      success: true,
      message: "Document is moved from the favorite document to teamspace.",
      data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message:
        "An error occurred while moving from the favorite document to teamspace.",
    });
  }
};
