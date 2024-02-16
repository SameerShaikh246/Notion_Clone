import documentsModel from "../models/documentsModel.js";
import pageModel from "../models/pageModel.js";
import cloudinary from "../utils/cloudinary.js";

export const createDocumentController = async (req, res) => {
  try {
    const {
      title,
      userId,
      isArchived,
      parentDocument,
      coverImage,
      content,
      Icon,
    } = req.body;

    const document = await new documentsModel({
      title,
      userId,
      isArchived,
      parentDocument,
      coverImage,
      content,
      Icon,
      type: "document",
    });

    const page = await new pageModel({
      document: document._id,
    }).save();
    if (page._id) {
      document.page = page._id;
    }

    await document.save();

    res.status(200).send({
      success: true,
      message: "Document created successfully",
      data: document,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while creating the document",
    });
  }
};
export const getChildDocumentController = async (req, res) => {
  try {
    const { parentDocument } = req.params;
    const userId = req.user.id;

    console.log("userId: ", userId, parentDocument);
    if (!parentDocument) {
      res.status(400).send({
        success: false,
        message: "Parent Document ID not found.",
        data: doc,
      });
    }
    // const doc = await documentsModel.find({ userId: userId }).populate({
    //   path: "users",
    //   populate: {
    //     path: "userId",
    //   },
    // });

    const doc = await documentsModel.find({
      userId: userId,
      parentDocument,
      isArchived: false,
    });
    for (let i = 0; i < doc.length; i++) {
      if (!doc[i]?.page) {
        const page = await new pageModel({
          document: doc[i]._id,
        }).save();

        let updatedDoc = await documentsModel.findByIdAndUpdate(
          doc[i]._id,
          {
            page: page._id,
          },
          {
            new: true,
          }
        );
        console.log("page updatedDoc", page, updatedDoc);
      }
    }
    res.status(200).send({
      success: true,
      message: "Document list fetched successfully",
      data: doc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while getting the document",
    });
  }
};

export const getDocumentController = async (req, res) => {
  try {
    const { parentDocument } = req.params;

    const userId = req.user.id;

    // const doc = await documentsModel.find({ userId: userId }).populate({
    //   path: "users",
    //   populate: {
    //     path: "userId",
    //   },
    // });
    const doc = await documentsModel.find({
      // userId: userId,
      parentDocument,
      isArchived: false,
    });
    console.log("userId: ", parentDocument, doc);

    for (let i = 0; i < doc.length; i++) {
      if (!doc[i]?.page) {
        const page = await new pageModel({
          document: doc[i]._id,
        }).save();

        await documentsModel.findByIdAndUpdate(
          doc[i]._id,
          {
            page: page._id,
          },
          {
            new: true,
          }
        );
      }
    }
    res.status(200).send({
      success: true,
      message: "Document list fetched successfully",
      data: doc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while getting the document",
    });
  }
};

async function deleteChildDocs(parentID) {
  const doc = await documentsModel.find({ parentDocument: parentID });
  if (doc.length > 0) {
    for (let i = 0; i < doc.length; i++) {
      await documentsModel.findByIdAndDelete(doc[i]._id);
      await pageModel.findByIdAndDelete(doc[i].page);
      await deleteChildDocs(doc[i]._id);
      // if (doc[i].cloudinary_id) {
      //   await cloudinary.uploader.destroy(doc[i].cloudinary_id);
      // }
    }
  }
}
export const deleteDocumentController = async (req, res) => {
  try {
    const { docId } = req.params;
    console.log("Document deleted id", docId);
    const document = await documentsModel.findById(docId);
    // console.log(document.userId, req.user.id);
    if (document.userId !== req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access",
      });
    }
    await deleteChildDocs(document._id); //Function to Delete all child documents before deleting the parent document and its children if any
    // if (document.cloudinary_id) {
    //   await cloudinary.uploader.destroy(document.cloudinary_id);
    // }
    await documentsModel.findByIdAndDelete(docId);
    await pageModel.findByIdAndDelete(document.page);
    // const docAsParent = await documentsModel.deleteMany({
    //   parentDocument: docId,
    // });

    res.status(200).send({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while deleting the document",
    });
  }
};

//for img to store in cloudnary

// export const updateDocumentController = async (req, res) => {
//   try {
//     const { title, _id: id } = req.body;
//     // if (!title) {
//     //   return res.status(404).send({
//     //     message: "Document title not found",
//     //   });
//     // }
//     if (!id) {
//       return res.status(404).send({
//         message: "Document id not found",
//       });
//     }
//     if (!title && !req.file) {
//       return res.status(404).send({
//         success: false,
//         message: "Document details not found.",
//       });
//     }

//     if (title && !req.file) {
//       const doc = await documentsModel.findByIdAndUpdate(
//         id,
//         {
//           title: title,
//         },
//         {
//           new: true,
//         }
//       );
//       return res.status(200).send({
//         success: true,
//         message: "Document title updated successfully",
//         data: doc,
//       });
//     } else if (req.file) {
//       // Delete image from cloudinary
//       const doc = await documentsModel.findById(id);
//       if (doc.cloudinary_id) {
//         await cloudinary.uploader.destroy(doc.cloudinary_id);
//       }
//       const result = await cloudinary.uploader.upload(req.file.path);
//       const updatedDoc = await documentsModel.findByIdAndUpdate(
//         id,
//         {
//           title: title,
//           icon: result.url,
//           cloudinary_id: result.public_id,
//         },
//         {
//           new: true,
//         }
//       );

//       return res.status(200).send({
//         success: true,
//         message: "Document updated successfully",
//         data: updatedDoc,
//       });
//     }
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "An error occurred while updating the document",
//     });
//   }
// };

//for icon
export const updateDocumentController = async (req, res) => {
  try {
    const { title, _id: id, icon, isCoverImage } = req.body;
    // if (!title) {
    //   return res.status(404).send({
    //     message: "Document title not found",
    //   });
    // }
    // console.log("updateDocumentController", req.file, req.body);
    if (!id) {
      return res.status(404).send({
        message: "Document id not found",
      });
    }

    if (req.file && isCoverImage) {
      // Delete image from cloudinary
      const doc = await documentsModel.findById(id);
      if (doc.cloudinary_id) {
        await cloudinary.uploader.destroy(doc.cloudinary_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path);
      const updatedDoc = await documentsModel.findByIdAndUpdate(
        id,
        {
          coverImage: result.url,
          cloudinary_id: result.public_id,
        },
        {
          new: true,
        }
      );
      return res.status(200).send({
        success: true,
        message: "Document updated successfully",
        data: updatedDoc,
      });
    }

    if (!title && !icon) {
      return res.status(404).send({
        success: false,
        message: "Document details not found.",
      });
    }

    if (title && !icon) {
      const doc = await documentsModel.findByIdAndUpdate(
        id,
        {
          title: title,
        },
        {
          new: true,
        }
      );
      return res.status(200).send({
        success: true,
        message: "Document title updated successfully",
        data: doc,
      });
    } else if (title && icon) {
      // Delete image from cloudinary
      // const doc = await documentsModel.findById(id);
      // if (doc.cloudinary_id) {
      //   await cloudinary.uploader.destroy(doc.cloudinary_id);
      // }
      // const result = await cloudinary.uploader.upload(req.file.path);
      const updatedDoc = await documentsModel.findByIdAndUpdate(
        id,
        {
          title: title,
          icon: icon,
        },
        {
          new: true,
        }
      );

      return res.status(200).send({
        success: true,
        message: "Document updated successfully",
        data: updatedDoc,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the document",
    });
  }
};

export const removeIconController = async (req, res) => {
  try {
    const { _id: id, icon } = req.body;

    if (!id) {
      return res.status(404).send({
        message: "Document id not found",
      });
    }

    const updatedDoc = await documentsModel.findByIdAndUpdate(
      id,
      {
        icon: null,
      },
      {
        new: true,
      }
    );

    return res.status(200).send({
      success: true,
      message: "Icon removed successfully",
      data: updatedDoc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while removing the document icon",
    });
  }
};

async function recursiveArchive(parentID) {
  const doc = await documentsModel.find({ parentDocument: parentID });
  if (doc.length > 0) {
    for (let i = 0; i < doc.length; i++) {
      await documentsModel.findByIdAndUpdate(
        doc[i]._id,
        {
          isArchived: true,
        },
        {
          new: true,
        }
      );
      await recursiveArchive(doc[i]._id);
    }
  }
}

export const archiveDocumentController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Document id not found",
      });
    }

    const document = await documentsModel.findById(id);

    if (document.userId !== req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access",
      });
    }
    // await recursiveArchive(document._id);
    document.isArchived = true;
    document.save();
    res.status(200).send({
      success: true,
      message: "Document archived successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while archiving the document",
    });
  }
};

async function recursiveRemoveArchive(parentID) {
  const doc = await documentsModel.find({ parentDocument: parentID });
  if (doc.length > 0) {
    for (let i = 0; i < doc.length; i++) {
      await documentsModel.findByIdAndUpdate(
        doc[i]._id,
        {
          isArchived: false,
        },
        {
          new: true,
        }
      );
      await recursiveArchive(doc[i]._id);
    }
  }
}

// export const removeArchiveDocumentController = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(404).send({
//         success: false,
//         message: "Document id not found",
//       });
//     }

//     const document = await documentsModel.findById(id);

//     if (document.userId !== req.user.id) {
//       return res.status(401).send({
//         success: false,
//         message: "Unauthorized access",
//       });
//     }
//     await recursiveRemoveArchive(document._id);
//     document.isArchived = false;
//     document.save();
//     res.status(200).send({
//       success: true,
//       message: "Document archived successfully",
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "An error occurred while archiving the document",
//     });
//   }
// };

export const removeArchiveDocumentController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Document id not found",
      });
    }
    const document = await documentsModel.findById(id);
    if (document.userId !== req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access",
      });
    }
    document.isArchived = false;
    document.save();
    res.status(200).send({
      success: true,
      message: "Removed archive document successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while removing archive document",
    });
  }
};

export const updateDocument = async (req, res) => {
  const document = await documentsModel.find();
  for (let index = 0; index < document.length; index++) {
    const doc = await documentsModel.findByIdAndUpdate(
      document[index]._id,
      {
        isArchived: false,
      },
      {
        new: true,
      }
    );
  }
  // document.isArchived = false;
  // document.save();
  res.status(200).send({
    data: document,
  });
};

export const getDocumentSearchController = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(404).send({
        success: false,
        message: "User id not found",
      });
    }

    const document = await documentsModel.find({
      userId: id,
      type: { $ne: "teamspace" },
    });

    const teamspace = await documentsModel.find({
      userId: id,
      type: "teamspace",
    });

    // if (document.userId !== req.user.id) {
    //   return res.status(401).send({
    //     success: false,
    //     message: "Unauthorized access",
    //   });
    // }
    res.status(200).send({
      success: true,
      message: "All document list fetched successfully",
      data: { document, teamspace },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while removing archive document",
    });
  }
};
