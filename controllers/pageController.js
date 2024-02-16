import documentsModel from "../models/documentsModel.js";
import pageModel from "../models/pageModel.js";

export const getPageController = async (req, res, next) => {
  const userId = req.user.id;
  const documentId = req.params.documentId;
  try {
    if (!userId || !documentId) {
      return res.status(400).send({
        success: false,
        message: "token or documentId not found.",
      });
    }
    const data = await documentsModel
      .findOne({
        // userId: userId,
        _id: documentId,
      })
      .select("-createdAt -updatedAt -__v ")
      .populate("page", "-__v");

    res.status(200).send({
      success: true,
      message: "page fetched successfully",
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the page.",
    });
  }
};

export const getPageContentController = async (req, res, next) => {
  const userId = req.user.id;
  const documentId = req.params.documentId;
  try {
    if (!userId || !documentId) {
      return res.status(400).send({
        success: false,
        message: "token or documentId not found.",
      });
    }
    const data = await pageModel.findOne({
      document: documentId,
    });
    res.status(200).send({
      success: true,
      message: "page fetched successfully",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while fetching the page.",
    });
  }
};
export const updatePageController = async (req, res) => {
  try {
    const id = req.params.pageId;
    const content = await pageModel.findByIdAndUpdate(
      id,
      {
        content: req.body.content,
      },
      {
        new: true,
      }
    );
    res.status(200).send({
      success: true,
      message: "page updated successfully",
      data: content,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the page content.",
    });
  }
};
