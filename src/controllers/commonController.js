const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const config = require("../config/config.js");
const S3 = new AWS.S3({ region: config.REGION });
const ReligionModel = require("../models/religionModel");
const CasteModel = require("../models/casteModel");
const MotherTongueModel = require("../models/motherTongueModel");
const OccupationModel = require("../models/occupationModel");
const PlansModel = require("../models/plansModel");
const AdminModel = require("../models/adminDetailsModel");
const UserModel = require("../models/userModel.js");

const {
  buildQueryFilter,
  sendEmail,
  uploadFileInS3,
  getFileFromS3,
} = require("../utils/helpers");
const { mongoose } = require("mongoose");
const fs = require("fs").promises;
const filePath = "../plans.json";

module.exports = {
  add: async (req, res, next) => {
    try {
      const data = await fs.readFile(filePath, "utf8");

      // Parse the JSON data
      const jsonData = JSON.parse(data);
      const postData = jsonData;
      console.log(postData);
      await UserModel.insertMany(postData);
      const response = {
        status: "success",
        message: "Data Imported successfully",
      };
      res.status(201).json(response);
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error code
        // Duplicate key error
        // Get the field that caused the error
        const field = Object.keys(error.keyPattern)[0];
        res.status(401).json({
          status: "error",
          message: `${field} is already exist.`,
        });
      } else {
        console.log("error:: ", JSON.stringify(error));
        res.status(401).json({
          status: "error",
          message:
            error?.message || "There is some problem, please try again later.",
        });
      }
    }
  },
  regionList: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 100;
      const skip = (page - 1) * limit;

      // Search filter
      const search = req.body.search || { status: "Active" };

      // Fields to include or exclude
      let defaultIncludeFields = "_id,name";
      defaultIncludeFields = defaultIncludeFields.split(",").join(" ");
      const fields = defaultIncludeFields;
      const query = {
        $and: await buildQueryFilter(search),
      };
      const users = await ReligionModel.find(query)
        .skip(skip)
        .limit(limit)
        .select(fields)
        .exec();

      const count = await ReligionModel.countDocuments(query).exec();

      res.json({
        status: "success",
        data: users,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  casteList: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 2000;
      const skip = (page - 1) * limit;

      // Search filter
      const search = { status: "Active" };

      // Fields to include or exclude
      let defaultIncludeFields = "_id, name, religion";
      defaultIncludeFields = defaultIncludeFields.split(",").join(" ");
      const fields = defaultIncludeFields;

      search.religion = new mongoose.Types.ObjectId(req.query.religion);
      const query = {
        $and: await buildQueryFilter(search),
      };
      console.log(query);
      const queryResult = await CasteModel.find(query)
        .skip(skip)
        .limit(limit)
        .select(fields)
        .exec();

      const count = await CasteModel.countDocuments(query).exec();

      res.json({
        status: "success",
        data: queryResult,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  motherTongueList: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 100;
      const skip = (page - 1) * limit;

      // Search filter
      const search = req.body.search || { status: "Active" };

      // Fields to include or exclude
      let defaultIncludeFields = "_id,name";
      defaultIncludeFields = defaultIncludeFields.split(",").join(" ");
      const fields = defaultIncludeFields;
      const query = {
        $and: await buildQueryFilter(search),
      };

      const queryResult = await MotherTongueModel.find(query)
        .skip(skip)
        .limit(limit)
        .select(fields)
        .exec();

      const count = await MotherTongueModel.countDocuments(query).exec();

      res.json({
        status: "success",
        data: queryResult,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  occupationList: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 2000;
      const skip = (page - 1) * limit;

      // Search filter
      const search = { status: "Active" };

      // Fields to include or exclude
      let defaultIncludeFields = "_id, name, category";
      defaultIncludeFields = defaultIncludeFields.split(",").join(" ");
      const fields = defaultIncludeFields;

      search.category = req.query.category || "";
      const query = {
        $and: await buildQueryFilter(search),
      };
      const queryResult = await OccupationModel.find(query)
        .skip(skip)
        .limit(limit)
        .select(fields)
        .exec();

      const count = await OccupationModel.countDocuments(query).exec();

      res.json({
        status: "success",
        data: queryResult,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  adminDetails: async (req, res, next) => {
    try {
      const contactDetails = await AdminModel.findOne({
        status: "Active",
      });
      res.json({
        status: "success",
        data: contactDetails,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  submitContactusDetails: async (req, res, next) => {
    try {
      const postData = req.body;
      const requiredFileds = {
        name: "Name",
        email: "Email ID",
        content: "Content",
      };

      // Find keys from requiredFields that are missing or have blank values in request
      const issues = Object.keys(requiredFileds).filter((key) => {
        // Check if the key is not present in request or has a blank value
        return !(key in postData) || postData[key].trim() === "";
      });

      // Get the values from requiredFileds for the identified keys
      const missingFileds = issues.map((key) => requiredFileds[key]);
      if (missingFileds.length) {
        const msg = missingFileds.length > 1 ? "are" : "is";
        return res.status(401).json({
          status: "error",
          message: `${missingFileds.join()} ${msg} required`,
        });
      }
      const mailOptions = {
        from: `Blissful Match<${config.SMTP_ADMIN_EMAIL}>`,
        to: config.SMTP_ADMIN_EMAIL,
        subject: "New Inquiry from " + postData.name,
        html:
          "Hi Admin,<br /><br />New inquiry received from contact us page, details are mentioned below<br /><br /><b>Name: </b>" +
          postData.name +
          "</b><br /><br /><b>Email: </b>" +
          postData.email +
          "</b><br /><br /><b>Message: </b>" +
          postData.content +
          "</b><br /><br /><br /><br />Warm Regards,<br />Blissful Match Team",
      };
      await sendEmail(mailOptions);
      res.status(201).json({
        status: "success",
        message: "Email sent successfully, we will contact you soon",
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  s3FileUpload: async (req, res, next) => {
    try {
      const keys = Object.keys(req.files);
      let s3Key = keys.length ? keys[0] : "";
      console.log("s3Key____________", s3Key);
      if (!s3Key || !config.S3_UPLOAD_FOR.includes(s3Key)) {
        return res.status(401).json({
          status: "error",
          message: "Please provide correct file option.",
        });
      }
      const files = req.files[s3Key];
      const splitFileName = files.name.split(".");
      const fileExt = splitFileName[splitFileName.length - 1];
      let newFileName = uuidv4();
      newFileName = `${newFileName}.${fileExt}`;
      const S3Key = `${config[s3Key]}/${req.user.id}/${newFileName}`;
      const fileBody = Buffer.from(files.data, "base64"); // Assuming base64 encoded file

      let s3Object = {
        Bucket: config.S3_BUCKET,
        Key: S3Key,
        ContentType: files.mimetype,
        ContentEncoding: "base64",
        Body: fileBody,
      };
      await uploadFileInS3(s3Object);

      let s3GetObject = {
        Bucket: config.S3_BUCKET,
        Key: S3Key,
        Expires: config.SIGNED_URL_EXPIRE_SECONDS,
      };
      let fileAccessUrl = await getFileFromS3(s3GetObject);
      let listOfFiles = {
        fileUrl: fileAccessUrl,
        file_name: newFileName,
      };

      res.status(201).json({
        status: "success",
        message: "File(s) uploaded successfully.",
        data: listOfFiles,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  uploadFiles: async (req, res, next) => {
    try {
      console.log(req.files);
      if (!req?.files) {
        res.status(401).json({
          status: "error",
          message: "No file selected",
        });
      }
      const keys = Object.keys(req.files);
      let s3Key = keys.length ? keys[0] : "";
      console.log("s3Key____________", s3Key);
      if (!s3Key || !config.S3_UPLOAD_FOR.includes(s3Key)) {
        return res.status(401).json({
          status: "error",
          message: "Please provide correct file option.",
        });
      }
      const files = req.files[s3Key];
      let listOfFiles;

      if (files.length) {
        listOfFiles = [];
        for (const filePath of files) {
          const splitFileName = filePath.name.split(".");
          const fileExt = splitFileName[splitFileName.length - 1];
          let newFileName = uuidv4();
          newFileName = `${newFileName}.${fileExt}`;
          const S3Key = `${config[s3Key]}/${req.user.id}/${newFileName}`;
          const fileBody = Buffer.from(filePath.data, "base64");

          let s3Object = {
            Bucket: config.S3_BUCKET,
            Key: S3Key,
            ContentType: filePath.mimetype,
            ContentEncoding: "base64",
            Body: fileBody,
          };
          console.log("s3Object_______________________", s3Object);
          await uploadFileInS3(s3Object);

          let s3GetObject = {
            Bucket: config.S3_BUCKET,
            Key: S3Key,
            Expires: config.SIGNED_URL_EXPIRE_SECONDS,
          };
          let fileAccessUrl = await getFileFromS3(s3GetObject);
          listOfFiles.push({
            fileUrl: fileAccessUrl,
            file_name: newFileName,
          });
        }
      } else {
        const splitFileName = files.name.split(".");
        const fileExt = splitFileName[splitFileName.length - 1];
        let newFileName = uuidv4();
        newFileName = `${newFileName}.${fileExt}`;
        const S3Key = `${config[s3Key]}/${req.user.id}/${newFileName}`;
        const fileBody = Buffer.from(files.data, "base64");

        let s3Object = {
          Bucket: config.S3_BUCKET,
          Key: S3Key,
          ContentType: files.mimetype,
          ContentEncoding: "base64",
          Body: fileBody,
        };
        console.log("s3Object_______________________", s3Object);
        await uploadFileInS3(s3Object);

        let s3GetObject = {
          Bucket: config.S3_BUCKET,
          Key: S3Key,
          Expires: config.SIGNED_URL_EXPIRE_SECONDS,
        };
        let fileAccessUrl = await getFileFromS3(s3GetObject);
        listOfFiles = {
          fileUrl: fileAccessUrl,
          file_name: newFileName,
        };
      }
      return res.status(201).json({
        status: "success",
        message: "File(s) uploaded successfully.",
        data: listOfFiles,
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
};
