import documentsModel from "../models/documentsModel.js";
import userModel from "../models/userModel.js";
import cloudinary from "../utils/cloudinary.js";
import nodemailer from "nodemailer";

export const createTeamspaceController = async (req, res) => {
  try {
    const { title, userId, description } = req.body;
    console.log("create teamsace", title, userId, description);
    if (!userId) {
      return res.status(404).send({
        success: false,
        message: "User id not found",
      });
    }
    if (!title) {
      return res.status(404).send({
        success: false,
        message: "teamspace title not found",
      });
    }
    const teamspace = await new documentsModel({
      title,
      userId,
      description,
      type: "teamspace",
    });
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      teamspace.icon = result.url;
      teamspace.cloudinary_id = result.public_id;
    }
    await teamspace.save();

    res.status(200).send({
      success: true,
      message: "Teamspace successfully created",
      data: teamspace,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while creating the teamspace",
    });
  }
};

export const getTeamspaceController = async (req, res) => {
  try {
    console.log("userId: ", req.user);
    const data = await documentsModel
      .find({
        userId: req.user.id,
        // teamspace: { $exists: true },
        type: "teamspace",
        isArchived: false,
      })
      .populate({ path: "userId" })
      .select("-createdAt -updatedAt -__v ");
    // let arg = {
    //   [`accessUsers.${[req.user.id]}`]: { $exists: true },
    // };
    const user = await userModel.findById(req.user.id);

    const sharedPages = await documentsModel.find({
      "accessUsers.email": user.email,
    });
    console.log("sharedPages", sharedPages);
    // const teamspace = await documentsModel
    //   .find({ userId: req.user })
    //   .populate("userId", "name email");
    res.status(200).send({
      success: true,
      message: "Teamspace list fetched successfully",
      data: [...data, ...sharedPages],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while getting the teamspace list.",
    });
  }
};

async function deleteChildDocs(parentID) {
  const doc = await documentsModel.find({ parentDocument: parentID });
  if (doc.length > 0) {
    for (let i = 0; i < doc.length; i++) {
      await documentsModel.findByIdAndDelete(doc[i]._id);
      await deleteChildDocs(doc[i]._id);
      if (doc[i].cloudinary_id) {
        await cloudinary.uploader.destroy(doc[i]?.cloudinary_id);
      }
    }
  }
}

export const deleteTeamspaceController = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentsModel.findById(id);
    if (document.userId !== req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access",
      });
    }
    // const childFolders = await documentsModel.findById(id);

    // if (childFolders.length > 0) {
    //   for (let i = 0; i < childFolders.length; i++) {
    //     console.log("deleted teamspace :", childFolders[i]._id);
    await deleteChildDocs(id);
    //     // if (childFolders[i].cloudinary_id) {
    //     //   await cloudinary.uploader.destroy(childFolders[i]?.cloudinary_id);
    //     // }
    //   }
    // }
    await documentsModel.deleteMany({
      teamspaceId: id,
    });

    await documentsModel.findByIdAndDelete(id);

    res.status(200).send({
      success: true,
      message: "Teamspace deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while deleting the teamspace.",
    });
  }
};

export const updateTeamspaceController = async (req, res) => {
  try {
    const { title, icon } = req.body;
    const { id } = req.params;
    // if (!title) {
    //   return res.status(404).send({
    //     message: "Document title not found",
    //   });
    // }

    if (!id) {
      return res.status(404).send({
        message: "Teamspace id not found",
      });
    }

    if (!title && icon) {
      return res.status(404).send({
        success: false,
        message: "Teamspace details not found.",
      });
    }

    if (title && !icon) {
      const doc = await documentsModel.findByIdAndUpdate(
        id,
        {
          title,
        },
        {
          new: true,
        }
      );
      return res.status(200).send({
        success: true,
        message: "Teamspace title updated successfully",
        data: doc,
      });
    } else if (icon) {
      // Delete image from cloudinary
      // const doc = await documentsModel.findById(id);
      // if (doc.cloudinary_id) {
      //   await cloudinary.uploader.destroy(doc.cloudinary_id);
      // }
      // const result = await cloudinary.uploader.upload(req.file.path);
      const updatedDoc = await documentsModel.findByIdAndUpdate(
        id,
        {
          title,
          icon: icon,
          // cloudinary_id: result.public_id,
        },
        {
          new: true,
        }
      );

      return res.status(200).send({
        success: true,
        message: "teamspace updated successfully",
        data: updatedDoc,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the teamspace",
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
// export const archiveTeamspaceController = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const document = await documentsModel.findById(id);
//     if (document.userId !== req.user.id) {
//       return res.status(401).send({
//         success: false,
//         message: "Unauthorized access",
//       });
//     }
//     //if there are already archived child folders then we need to find only isArchived:false documents

//     const childFolders = await documentsModel.find({
//       teamspaceId: id,
//     });

//     if (childFolders.length > 0) {
//       for (let i = 0; i < childFolders.length; i++) {
//         await recursiveArchive(childFolders[i]._id);
//         await documentsModel.findByIdAndUpdate(
//           childFolders[i]._id,
//           {
//             isArchived: true,
//           },
//           {
//             new: true,
//           }
//         );
//       }
//     }

//     await documentsModel.findByIdAndUpdate(
//       id,
//       {
//         isArchived: true,
//       },
//       {
//         new: true,
//       }
//     );

//     res.status(200).send({
//       success: true,
//       message: "Teamspace archived successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "An error occurred while archiving the teamspace.",
//     });
//   }
// };

export const archiveTeamspaceController = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentsModel.findById(id);
    if (document.userId !== req.user.id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access",
      });
    }

    let data = await documentsModel.findByIdAndUpdate(
      id,
      {
        isArchived: true,
      },
      {
        new: true,
      }
    );

    res.status(200).send({
      success: true,
      message: "Teamspace archived successfully",
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while archiving the teamspace.",
    });
  }
};

//share onlu teamspace to the other users with access type
// export const membersController = async (req, res) => {
//   try {
//     const { id } = req.user;
//     const { docId } = req.params;
//     const { userId, access } = req.body;

//     const document = await documentsModel.findById(docId);
//     if (!id && document.userId !== req.user.id) {
//       return res.status(404).send({
//         success: false,
//         message: "Unauthorized access",
//       });
//     }
//     if (!access && !userId) {
//       return res.status(404).send({
//         success: false,
//         message: "Invalid details for the access and user id.",
//       });
//     }
//     if (document.type !== "teamspace") {
//       return res.status(404).send({
//         success: false,
//         message: "Only teamspace can shared with the members",
//       });
//     }
//     const doc = await documentsModel.findOneAndUpdate(
//       { _id: docId, "accessUsers.userId": userId },
//       { $set: { "accessUsers.$.access": access } },
//       {
//         upsert: true,
//         returnNewDocument: true,
//         arrayFilters: [{ "elem.userId": userId }],
//       }
//     );

//     res.status(200).send({
//       success: true,
//       message: "Access granted to " + userId,
//       data: doc,
//     });

//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "An error occurred while giving access to members",
//     });
//   }
// };

/////////////////////////
// Track the last notification time

// for notification email
// if user change somthing on the page then notify the admin only once in 30 min
// multiple user will have access to page

let timerCheck = {
  userEmail: "timer",
};

console.log("timerCheck", timerCheck);
export const membersController = async (req, res) => {
  try {
    const { id } = req.user;
    const { docId } = req.params;
    const { userId, access, email } = req.body;
    let currentTime = new Date();
    currentTime = currentTime.getTime();
    if (!access) {
      return res.status(404).send({
        success: false,
        message: "Invalid details for access user.",
      });
    }
    if (!email && !userId) {
      return res.status(404).send({
        success: false,
        message: "Invalid details for the access and user.",
      });
    }

    if (email) {
      const checkUser = await userModel.findOne({ email: email });
      const owner = await userModel.findById(id);
      //if checkUser is available then no need to send email invitation
      // const document = await documentsModel.findById(docId);
      const document = await documentsModel.findOne({ _id: docId });
      if (!document || document === null) {
        return res.status(404).send({
          success: false,
          message: "Document not found.",
        });
      }
      console.log("Sending email invitation", id, document.userId);
      //comparing the document user id and admin id
      if (!document.userId.equals(id)) {
        return res.status(404).send({
          success: false,
          message: "Unauthorized access here",
        });
      }
      if (document.type !== "teamspace") {
        return res.status(404).send({
          success: false,
          message: "Only teamspace can shared with the members",
        });
      }
      await documentsModel.updateOne(
        { _id: docId },
        {
          $pull: { accessUsers: { email: email } },
        }
      );
      await documentsModel.updateOne(
        { _id: docId },
        {
          $addToSet: {
            accessUsers: { email: email, access },
          },
        },
        {
          upsert: true,
        }
      );
      if (checkUser) {
        if (
          !timerCheck[email] ||
          currentTime - timerCheck[email] >= 15 * 60 * 1000
        ) {
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
            subject: "Invite Link to join the shared document.",
            html:
              owner.name +
              '<p> is send you a link of his teamspace, Click <a href="http://localhost:5173/documents' +
              '">here</a> to view.</p>',
          };

          await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              return res.status(200).send({
                success: true,
                message: "invite mail sent on " + email,
              });
            }
          });
          console.log("timerCheck 1", timerCheck);

          timerCheck[email] = currentTime;
        } else {
          console.log("timerCheck 2", timerCheck);

          return res.status(200).send({
            success: true,
            message: "Access granted to " + email,
            // data: doc2,
          });
        }
      } else {
        if (
          !timerCheck[email] ||
          currentTime - timerCheck[email] >= 15 * 60 * 1000
        ) {
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
            from: process.env.EMAIL_NODEMAILER,
            to: email,
            subject:
              "Invite Link for Notion clone app and join the shared document.",
            html:
              owner.name +
              '<p> is send you a link of his teamspace, Click <a href="http://localhost:5173/documents' +
              '">here</a> to join.</p>',
          };

          await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              return res.status(200).send({
                success: true,
                message:
                  "User is not registered with Notion invite mail sent on " +
                  email,
              });
            }
          });
          console.log("timerCheck 3", timerCheck);

          timerCheck[email] = currentTime;
        } else {
          console.log("timerCheck 4", timerCheck);

          res.status(200).send({
            success: true,
            message:
              "User is not registered with Notion invite mail sent on " + email,
            // data: doc2,
          });
        }
        // need to send the invite email to the new user to join notion and view the invite document
      }
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while giving access to member",
    });
  }
};

export const getSharedDocuments = async (req, res) => {
  try {
    let arg = {
      [req.user.id]: { $exists: true },
    };
    const sharedPages = await documentsModel.find({
      accessUsers: { $exists: arg },
    });
    console.log("sharedPages", sharedPages);
    res.status(200).send({
      success: true,
      message: "Pages list fetched successfully",
      data: sharedPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while getting the shared pages.",
    });
  }
};

export const leaveTeamspaceController = async (req, res) => {
  try {
    const { id } = req.user;
    const { docId } = req.params;
    if (!docId) {
      return res.status(404).send({
        success: false,
        message: "Teamspace ID is required.",
      });
    }
    const user = await userModel.findById(id);
    console.log("user to leave teamspace", user, "teamspace id", docId);
    let check = await documentsModel.find({
      _id: docId,
      "accessUsers.email": user.email,
      type: "teamspace",
    });
    console.log("checkcheck", check);

    if (check.length === 0) {
      return res.status(200).send({
        success: true,
        message: "Already left the teamspace or not a member.",
      });
    }

    let teamspace = await documentsModel.findOneAndUpdate(
      { _id: docId, type: "teamspace" },
      {
        $pull: { accessUsers: { email: user.email } },
      }
    );

    console.log("updated teamspace", teamspace);
    res.status(200).send({
      success: true,
      message: "Successfully left the teamspace.",
      data: teamspace,
    });
  } catch (error) {
    res.status(500).send({
      message: "An error occurred while leaving the teamspace",
      success: false,
    });
  }
};
