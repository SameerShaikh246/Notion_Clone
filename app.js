import express from "express";
import cors from "cors";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import Oauth2 from "passport-google-oauth2";
import userModel from "./models/userModel.js";
import authRoutes from "./routes/authRoute.js";
import documentsRoute from "./routes/documentsRoute.js";
import usersRoute from "./routes/usersRoute.js";
import teamspaceRoute from "./routes/teamspaceRoute.js";
import usersFavoriteRoute from "./routes/favoritesRoute.js";
import trashRoute from "./routes/trashRoute.js";
import pageRoute from "./routes/pageRoute.js";
import settingsRoute from "./routes/settingsRoute.js";
import morgan from "morgan";
import { updateDocument } from "./controllers/documentController.js";
import documentsModel from "./models/documentsModel.js";

const Oauth2Strategy = Oauth2.Strategy;
const PORT = 8080;
const app = express();
// app.use(cors());
app.use(morgan("dev"));

const clientid =
  "755508981299-kulsckh08u8r5fkjsm30b5qjkqau3gro.apps.googleusercontent.com";
const clientsecret = "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";

//config env
dotenv.config();

//middleware
//database config
connectDB();

//update and remoce filed from all documents in the database
// async function call() {
//   let res = await documentsModel.updateMany({ $unset: { cloudinary_id: "" } });
//   let res2 = await documentsModel.updateMany({ $unset: { icon: "" } });
//   console.log("res", res, res2);
// }
// call();

app.use(express.json()); // replacement for bodyparser before this function we use bodyparser

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

//setup session : by this session we get incrypted id and from that id we get the user details
app.use(
  session({
    secret: "123456abcdef",
    resave: false,
    saveUninitialized: true,
  })
);

//setup passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new Oauth2Strategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("profile", profile);
      try {
        let user = await userModel.findOne({
          googleId: profile.id,
        });
        if (user) {
          await userModel.findByIdAndUpdate(
            user._id,
            {
              status: "Active",
            },
            { new: true }
          );
        }
        if (!user) {
          user = new userModel({
            googleId: profile.id,
            name: profile.given_name,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
            status: "Active",
          });

          user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

//inital google auth login

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.post("/update", updateDocument);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/documents",
    failureRedirect: "http://localhost:5173/login",
  })
);

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/page", pageRoute);
app.use("/api/v1/document", documentsRoute);
app.use("/api/v1/teamspace", teamspaceRoute);
app.use("/api/v1/favorite", usersFavoriteRoute);
app.use("/api/v1/user", usersRoute);
app.use("/api/v1/trash", trashRoute);
app.use("/api/v1/settings", settingsRoute);

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:5173/login");
  });
});

app.listen(PORT, () => {
  console.log("server listening on port ", PORT);
});
