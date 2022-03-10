import express from "express";
import storage from "../db/userStorageConnection.js";
const router = express.Router();
import upload from "../middleware/uploadFile.js";
import uuid from "uuid-v4";
import fs from "fs";
import jwt from "jsonwebtoken";
import userDetail from "../models/userDetail_model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import compressFile from "../functions/compressFile.js";
const bucket = storage.bucket();
router.post("/u/post", upload.single("image"), async (req, res) => {
  try {
    const token = req.cookies.AuthToken;
    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
    const rootUser = await userDetail.findOne({
      _id: verifyToken._id,
      "tokens.token": token,
    });
    if (!req.body.caption && !req.file) {
      // if user doesn't fill the any filed
      return res.status(401).json({ error: "Please fill the post properly" });
    } else if (req.body.caption && !req.file) {
      // if user only fill content field
      if (rootUser) {
        const caption = req.body.caption;
        const postID = crypto.randomBytes(16).toString("hex");
        const userPostDetail = {
          id: postID,
          caption: caption,
          likes: {
            No: 0,
          },
          comments: {
            No: 0,
          },
        };
        const postRes = await rootUser.uploadPost(userPostDetail);
        const resData = {
          id: postRes[0].id,
          useremail: rootUser.email,
          username: rootUser.name,
          userID: rootUser.userID,
          profilePicture: rootUser.picture,
          caption: postRes[0].caption,
          picture: "",
          likes: postRes[0].likes,
          comments: postRes[0].comments,
          date: postRes[0].date,
        };
        return res.status(201).json(resData);
      } else {
        return res.status(401).json({ error: "Authetication error" });
      }
    } else {
      // if user fill both field
      const token = req.cookies.AuthToken;
      const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
      const rootUser = await userDetail.findOne({
        _id: verifyToken._id,
        "tokens.token": token,
      });
      // console.log(rootUser);
      if (rootUser) {
        // uploading image to firebase Storage
        await compressFile(req.file.path);
        // deleting uncompressed file after compressed
        fs.unlink(`./db/Images/${req.file.filename}`, (err) => {});
        const metadata = {
          metadata: {
            firebaseStorageDownloadTokens: uuid(),
          },
          cacheControl: "public, max-age=31536000",
        };
        const uploadRes = await bucket.upload(
          `./db/build/${req.file.filename}`,
          {
            destination: `images/${rootUser.email}/${req.file.filename}`,
            gzip: true,
            metadata: metadata,
          }
        );
        // here we are again deleting the compressed file after upload to firebase
        fs.unlink(`./db/build/${req.file.filename}`, (err) => {});
        // console.log(uploadRes);
        const caption = req.body.caption;
        const picName = req.file.filename;
        const picPath = `images/${rootUser.email}/${req.file.filename}`;
        const picToken =
          uploadRes[0].metadata.metadata.firebaseStorageDownloadTokens;
        const picBucket = process.env.FIREBASE_STORAGEBUCKET;
        const picUrl = `https://firebasestorage.googleapis.com/v0/b/${picBucket}/o/${encodeURIComponent(
          picPath
        )}?alt=media&token=${picToken}`;
        const postID = crypto.randomBytes(16).toString("hex");
        const userPostDetail = {
          id: postID,
          caption: caption,
          picture: {
            name: picName,
            path: picPath,
            url: picUrl,
            firebaseStorageDownloadToken: picToken,
            bucket: picBucket,
          },
          likes: {
            No: 0,
          },
          comments: {
            No: 0,
          },
        };
        const postRes = await rootUser.uploadPost(userPostDetail);
        const resData = {
          id: postRes[0].id,
          useremail: rootUser.email,
          username: rootUser.name,
          userID: rootUser.userID,
          profilePicture: rootUser.picture,
          caption: postRes[0].caption,
          picture: postRes[0].picture,
          likes: postRes[0].likes,
          comments: postRes[0].comments,
          date: postRes[0].date,
        };
        return res.status(201).json(resData);
      } else {
        return res.status(401).json({ error: "Authetication error" });
      }
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Server Error!!, Please Try again letter" });
  }
});

router.post("/u/userId", upload.single("profile"), async (req, res) => {
  try {
    const { email, password, userID, auth } = req.body;
    if (auth === "google") {
      // if user is login using google authetication and user doesnot have a password
      if (!email) {
        return res.status(422).json({ error: "Please Register Frist" });
      }
    } else {
      // if user is register using social account then will have a password
      if (!email && !password) {
        return res.status(422).json({ error: "Please Register Frist" });
      }
    }
    if (!userID) {
      return res.status(422).json({ error: "Please Fill Field Properly" });
    }
    const userIDExist = await userDetail.findOne(
      { userID: userID },
      { userID: 1, name: 1, email: 1 }
    );
    if (userIDExist) {
      console.log(userIDExist);
      return res.json({ msg: "userID Already Exist, Please Try Another One" });
    } else {
      const rootUser = await userDetail.findOne({ email: email });
      if (!rootUser) {
        return res.status(422).json({ error: "User doesn't exist" });
      }
      if (auth !== "google") {
        // if user is login using google authetication and user doesnot have a password
        const isPasswordMatch = await bcrypt.compare(
          password,
          rootUser.password
        );
        if (!isPasswordMatch) {
          return res
            .status(400)
            .json({ error: "email and password doesn't match" });
        }
      }
      if (!req.file) {
        const resData = await userDetail.updateOne(
          { email: email },
          { $set: { userID: userID } }
        );
        return res.status(201).json({ message: "Register Successfully" });
      } else {
        await compressFile(req.file.path);
        fs.unlink(`./db/Images/${req.file.filename}`, (err) => {});
        const metadata = {
          metadata: {
            firebaseStorageDownloadTokens: uuid(),
          },
          cacheControl: "public, max-age=31536000",
        };
        const uploadRes = await bucket.upload(
          `./db/build/${req.file.filename}`,
          {
            destination: `images/${rootUser.email}/${req.file.filename}`,
            gzip: true,
            metadata: metadata,
          }
        );
        // here we are again deleting the compressed file after upload to firebase
        fs.unlink(`./db/build/${req.file.filename}`, (err) => {});
        // console.log(uploadRes);
        const userID = req.body.userID;
        const caption = `${userID} Update The Profile Picture`;
        const picName = req.file.filename;
        const picPath = `images/${rootUser.email}/${req.file.filename}`;
        const picToken =
          uploadRes[0].metadata.metadata.firebaseStorageDownloadTokens;
        const picBucket = process.env.FIREBASE_STORAGEBUCKET;
        const picUrl = `https://firebasestorage.googleapis.com/v0/b/${picBucket}/o/${encodeURIComponent(
          picPath
        )}?alt=media&token=${picToken}`;
        // here we also have to post to the feed and also have to save picture as profile
        const postID = crypto.randomBytes(16).toString("hex");
        const userPostDetail = {
          id: postID,
          caption: caption,
          picture: {
            name: picName,
            path: picPath,
            url: picUrl,
            firebaseStorageDownloadToken: picToken,
            bucket: picBucket,
          },
          likes: {
            No: 0,
          },
          comments: {
            No: 0,
          },
        };
        // here we are posting user news Feed
        const resPost = await rootUser.uploadPost(userPostDetail);
        // now we will save picture as profile picture
        const resData = await userDetail.updateOne(
          { email: email },
          { $set: { userID: userID, picture: picUrl } }
        );
        res.status(201).json({ message: "Register Successfully" });
      }
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Server Error!!, Please Try again letter" });
  }
});

export default router;
