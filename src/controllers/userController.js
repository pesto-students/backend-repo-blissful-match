const UserModel = require("../models/userModel");
const ShortlistedUsersModel = require("../models/shortlistedUserModel");
const CasteModel = require("../models/casteModel");
const MotherToungeModel = require("../models/motherTongueModel");
const PaymentModel = require("../models/paymentModel");
const ViewedContactsModel = require("../models/viewedDetailsModel");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const bcrypt = require("bcryptjs");
const {
  buildQueryFilter,
  sendEmail,
  validatePassword,
} = require("../utils/helpers");
const { mongoose } = require("mongoose");

module.exports = {
  register: async (req, res, next) => {
    try {
      const postData = req.body;
      const requiredFileds = {
        first_name: "First Name",
        last_name: "Last Name",
        date_of_birth: "Date of Birth",
        gender: "Gender",
        religion: "Religion",
        email_address: "Email Address",
        mobile: "Mobile",
        password: "Password",
        confirm_password: "Confirm Password",
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
      if (postData.password != postData.confirm_password) {
        return res.status(401).json({
          status: "error",
          message: `Password and Confirm Password must be same.`,
        });
      }
      await UserModel.create(postData);
      const response = {
        status: "success",
        message: "User added successfully",
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
  login: async (req, res, next) => {
    try {
      const { email_address, password } = req.body;

      // Find user by email_address
      const user = await UserModel.findOne({ email_address });
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: `Please provide correct Email Address`,
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          status: "error",
          message: "Please provide correct Password.",
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRY_IN, // Token expiration
      });
      delete user.password;
      delete user.updated_at;
      delete user.created_at;
      delete user.__v;
      const response = {
        status: "success",
        message: "Login successfully",
        user: user,
        token: token,
      };
      res.status(200).json(response);
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(500).send("Server error");
    }
  },
  members: async (req, res, next) => {
    try {
      const page = parseInt(req.body.currentPage) || 1;
      const limit = parseInt(req.body.pageSize) || 10;
      const skip = (page - 1) * limit;

      // Search filter
      const search = req.body.search || "";

      // Fields to include or exclude
      let defaultIncludeFields = "";
      /* "_id,first_name,middle_name,last_name,date_of_birth,gender,religion,email_address,mobile,status"; */
      defaultIncludeFields = defaultIncludeFields.split(",").join(" ");
      const fields = defaultIncludeFields;
      if (req.user) {
        console.log("User id ", req.user.id);
        search.gender = req.user.gender == "Male" ? "Female" : "Male";
        search._id = { $ne: req.user.id };
      }
      search.status = "Active";
      const query = {
        $and: await buildQueryFilter(search),
      };

      const users = await UserModel.find(query)
        .skip(skip)
        .limit(limit)
        .select(fields)
        .exec();

      const count = await UserModel.countDocuments(query).exec();

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
  shortListUser: async (req, res, next) => {
    try {
      const requestPayload = {
        shortlisted_by: req.user.id,
        shortlisted_to: new mongoose.Types.ObjectId(req.body.receiverId),
      };
      const isExistDetails = await ShortlistedUsersModel.findOne(
        requestPayload
      );

      if (!isExistDetails) {
        await ShortlistedUsersModel.create(requestPayload);
        const response = {
          status: "success",
          message: "User Shortlisted successfully",
        };
        res.status(201).json(response);
      } else {
        res.status(401).json({
          status: "error",
          message: `User is already shortlisted.`,
        });
      }
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
  removeShortListedUser: async (req, res, next) => {
    try {
      const requestPayload = {
        shortlisted_by: req.user.id,
        shortlisted_to: new mongoose.Types.ObjectId(req.body.receiverId),
      };
      const isDeleted = await ShortlistedUsersModel.deleteOne(requestPayload);

      if (!isDeleted.deletedCount) {
        const response = {
          status: "error",
          message: "User is already removed from Shortlisted list",
        };
        res.status(401).json(response);
      } else {
        const response = {
          status: "success",
          message: "User removed from Shortlisted list successfully",
        };
        res.status(201).json(response);
      }
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  getShortListedUser: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 10;
      const skip = (page - 1) * limit;

      const pipeline = [
        {
          $match: { shortlisted_by: req.user.id },
        },
        {
          $lookup: {
            from: "users",
            localField: "shortlisted_to",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            _id: "$userDetails._id",
            first_name: "$userDetails.first_name",
            last_name: "$userDetails.last_name",
            date_of_birth: "$userDetails.date_of_birth",
            gender: "$userDetails.gender",
            religion: "$userDetails.religion",
            email_address: "$userDetails.email_address",
            mobile: "$userDetails.mobile",
            qualification: "$userDetails.qualification",
            annual_income: "$userDetails.annual_income",
            age: "$userDetails.age",
            caste: "$userDetails.caste",
            mother_tongue: "$userDetails.mother_tongue",
            full_address: "$userDetails.full_address",
            profile_image: "$userDetails.profile_image",
            maritial_status: "$userDetails.maritial_status",
            status: "$userDetails.status",
          },
        },
      ];

      const results = await ShortlistedUsersModel.aggregate(pipeline)
        .skip(skip)
        .limit(limit);
      console.log(results);

      const count = await ShortlistedUsersModel.countDocuments({
        shortlisted_by: req.user.id,
      }).exec();

      res.json({
        status: "success",
        data: results,
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
  sendResetPasswordOTP: async (req, res, next) => {
    try {
      const rewParams = req.body;
      if (!rewParams?.email) {
        return res.status(401).json({
          status: "error",
          message: "Please provide email address",
        });
      }
      const isExist = await UserModel.findOne({
        email_address: rewParams.email,
      });
      if (!isExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, User is not exist.`,
        });
      }
      //update otp in database
      const otp = Math.floor(100000 + Math.random() * 900000);
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(isExist["_id"]) },
        { $set: { otp: otp } }
      );

      //send OTP in email
      const mailOptions = {
        from: `Blissful Match<${config.SMTP_ADMIN_EMAIL}>`,
        to: isExist.email_address,
        subject: "Your Blissful Match password information",
        html:
          "Hi " +
          isExist.first_name +
          " " +
          isExist.last_name +
          ",<br /><br />We noticed that you tried to reset password on your Blissful Match profile.<br /><br />Your one time password is <b>" +
          otp +
          "</b>. Enter the OTP to continue and reset password successfully.<br /><br />Warm Regards,<br />Blissful Match Team",
      };
      await sendEmail(mailOptions);
      return res.status(201).json({
        status: "success",
        message: "OTP sent successfully on your email.",
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
  verifyRestPasswordOTP: async (req, res, next) => {
    try {
      const rewParams = req.body;
      if (!rewParams?.email) {
        return res.status(401).json({
          status: "error",
          message: "Please provide email address",
        });
      }
      if (!rewParams?.otp) {
        return res.status(401).json({
          status: "error",
          message: "Please provide OTP",
        });
      }
      const isExist = await UserModel.findOne({
        email_address: rewParams.email,
      });
      if (!isExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, User is not exist.`,
        });
      }
      if (isExist.otp != rewParams.otp) {
        return res.status(401).json({
          status: "error",
          message: "Incorrect OTP, please try with correct OTP.",
        });
      }
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(isExist["_id"]) },
        { $set: { verified_reset_otp: true } }
      );
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(isExist["_id"]) },
        { $unset: { otp: "" } }
      );
      res.status(200).json({
        status: "success",
        message: "OTP verified successfully",
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
  updatePassword: async (req, res, next) => {
    try {
      const postData = req.body;
      const requiredFileds = {
        password: "Password",
        confirm_password: "Confirm Password",
        email: "Email Address",
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
      if (postData.password !== postData.confirm_password) {
        return res.status(401).json({
          status: "error",
          message: "Password & Confirm Password should be same.",
        });
      }
      const isValidPassword = await validatePassword(postData.password);
      if (!isValidPassword.valid) {
        return res.status(401).json({
          status: "error",
          message: isValidPassword.message,
        });
      }
      const isExist = await UserModel.findOne({
        email_address: postData.email,
      });

      if (!isExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, User is not exist.`,
        });
      }
      if (!isExist?.verified_reset_otp) {
        return res.status(401).json({
          status: "error",
          message: "Password already updated, please login with new password",
        });
      }
      let encryptedPassword = await bcrypt.hash(
        postData.password,
        config.SALT_ROUNDS
      );
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(isExist["_id"]) },
        { $set: { password: encryptedPassword } }
      );
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(isExist["_id"]) },
        { $unset: { verified_reset_otp: "" } }
      );
      res.status(201).json({
        status: "success",
        message: "Password updated successfully",
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
  changePassword: async (req, res, next) => {
    try {
      const postData = req.body;
      const requiredFileds = {
        current_password: "Current Password",
        new_password: "New Password",
        confirm_password: "Confirm Password"
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
      if (postData.new_password !== postData.confirm_password) {
        return res.status(401).json({
          status: "error",
          message: "New Password & Confirm Password should be same.",
        });
      }
      const isValidPassword = await validatePassword(postData.new_password);
      if (!isValidPassword.valid) {
        return res.status(401).json({
          status: "error",
          message: isValidPassword.message,
        });
      }
      const isExist = await UserModel.findOne({
        _id: req.user.id,
      });

      if (!isExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, User is not exist.`,
        });
      }
      let isSamePassword = await bcrypt.compare(
        postData.current_password,
        isExist.password
      );
      if(!isSamePassword){
        return res.status(401).json({
          status: "error",
          message: "Please provide valid Current Password and try again.",
        });
      }
      
      let encryptedPassword = await bcrypt.hash(
        postData.new_password,
        config.SALT_ROUNDS
      );
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(req.user.id) },
        { $set: { password: encryptedPassword } }
      );
      res.status(201).json({
        status: "success",
        message: "Password changed successfully",
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
  viewedContact: async (req, res, next) => {
    try {
      const postData = req.body;
      if (!postData.memberId) {
        return res.status(401).json({
          status: "error",
          message: "Please select any member to view contact details.",
        });
      }
      if (req.user.id == postData.memberId) {
        return res.status(401).json({
          status: "error",
          message: "Invalid Request, you can't view for logged-in user'.",
        });
      }
      const isExist = await UserModel.findOne({
        _id: new mongoose.Types.ObjectId(postData.memberId),
      });

      if (!isExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, This user is not exist.`,
        });
      }
      const isPlanExist = await PaymentModel.findOne({
        user_id: new mongoose.Types.ObjectId(req.user.id),
        expired_at: { $gt: new Date().toISOString() },
        status: "success",
      });
      if (!isPlanExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, You don't have any active plan, please buy a plan first.`,
        });
      }
      const remainBalance = parseInt(isPlanExist.remaining_contact_view_limit);
      if (remainBalance > 0) {
        const insertData = {
          viewed_by: req.user.id,
          viewed_to: postData.memberId,
        };
        await ViewedContactsModel.create(insertData);
        await PaymentModel.updateOne(
          { _id: new mongoose.Types.ObjectId(isPlanExist._id) },
          {
            $set: {
              remaining_contact_view_limit:
                isPlanExist.remaining_contact_view_limit - 1,
            },
          }
        );
        req.query.user_id = postData.memberId
        module.exports.getMembersProfile(req, res, next);
        /* const contactViewDetails = {
          email_address: isExist.email_address,
          mobile: isExist.mobile,
          contact_number: isExist.contact_number || "",
          alternate_contact_number1: isExist.alternate_contact_number1 || "",
          alternate_contact_number2: isExist.alternate_contact_number2 || "",
        };
        const response = {
          status: "success",
          items: contactViewDetails,
        };
        return res.status(201).json(response); */
      } else {
        return res.status(401).json({
          status: "error",
          message:
            "Sorry, you have used all contact view balance, please buy a new plan.",
        });
      }
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  getViewedHistory: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 10;
      const skip = (page - 1) * limit;

      const pipeline = [
        {
          $match: { viewed_by: req.user.id },
        },
        {
          $lookup: {
            from: "users",
            localField: "viewed_to",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            _id: "$userDetails._id",
            first_name: "$userDetails.first_name",
            last_name: "$userDetails.last_name",
            date_of_birth: "$userDetails.date_of_birth",
            gender: "$userDetails.gender",
            religion: "$userDetails.religion",
            email_address: "$userDetails.email_address",
            mobile: "$userDetails.mobile",
            qualification: "$userDetails.qualification",
            annual_income: "$userDetails.annual_income",
            age: "$userDetails.age",
            caste: "$userDetails.caste",
            mother_tongue: "$userDetails.mother_tongue",
            full_address: "$userDetails.full_address",
            profile_image: "$userDetails.profile_image",
            maritial_status: "$userDetails.maritial_status",
            status: "$userDetails.status",
          },
        },
      ];

      const results = await ViewedContactsModel.aggregate(pipeline)
        .skip(skip)
        .limit(limit);

      const count = await ViewedContactsModel.countDocuments({
        shortlisted_by: req.user.id,
      }).exec();

      const isPlanExist = await PaymentModel.findOne({
        user_id: new mongoose.Types.ObjectId(req.user.id),
      });
      let totalViewedLimit = 0;
      let usedViewedLimit = 0;
      if (isPlanExist) {
        totalViewedLimit = isPlanExist.contact_limit;
        usedViewedLimit = isPlanExist.remaining_contact_view_limit;
      }
      res.json({
        status: "success",
        totalViewedLimit,
        usedViewedLimit,
        data: results,
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
  updateProfile: async (req, res, next) => {
    try {
      const postData = req.body;
      console.log("Before ", postData);
      if (!postData?.basic_info?.first_name) {
        res.status(401).json({
          status: "error",
          message: "First Name is required.",
        });
      }
      if (!postData?.basic_info?.last_name) {
        res.status(401).json({
          status: "error",
          message: "Last Name is required.",
        });
      }
      if (!postData?.basic_info?.last_name) {
        res.status(401).json({
          status: "error",
          message: "Last Name is required.",
        });
      }

      if (!postData?.astro_details?.date_of_birth) {
        res.status(401).json({
          status: "error",
          message: "Date of Birth is required.",
        });
      }
      if (!postData?.physical_attributes?.gender) {
        res.status(401).json({
          status: "error",
          message: "Gender is required.",
        });
      }
      if (!postData?.religious_social_background?.religion) {
        res.status(401).json({
          status: "error",
          message: "Religion is required.",
        });
      }
      if (!postData?.religious_social_background?.caste) {
        res.status(401).json({
          status: "error",
          message: "Caste is required.",
        });
      }
      const isCasteExist = await CasteModel.findOne({
        _id: new mongoose.Types.ObjectId(
          postData?.religious_social_background?.caste
        ),
      });
      if (!isCasteExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, Invalid Caste`,
        });
      }

      if (
        isCasteExist.religion != postData?.religious_social_background?.religion
      ) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, Religion is invalid`,
        });
      }

      postData.religious_social_background.religion =
        new mongoose.Types.ObjectId(
          postData?.religious_social_background?.religion
        );
      postData.religious_social_background.caste = new mongoose.Types.ObjectId(
        postData?.religious_social_background?.caste
      );

      if (postData?.religious_social_background?.mother_tongue) {
        const isMTExist = await MotherToungeModel.findOne({
          _id: new mongoose.Types.ObjectId(
            postData?.religious_social_background?.mother_tongue
          ),
        });
        if (!isMTExist) {
          return res.status(401).json({
            status: "error",
            message: `Sorry, Invalid Mother Tounge`,
          });
        }
        postData.religious_social_background.mother_tongue =
          new mongoose.Types.ObjectId(
            postData?.religious_social_background?.mother_tongue
          );
      }
      console.log("After ", postData);
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(req.user.id) },
        { $set: postData }
      );
      res.status(201).json({
        status: "success",
        message: "User profile updated successfully.",
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
  getMyProfile: async (req, res, next) => {
    try {
      const pipeline = [
        {
          $match: { _id: req.user.id },
        },
        {
          $lookup: {
            from: "religions",
            localField: "religious_social_background.religion",
            foreignField: "_id",
            as: "religionsDetails",
          },
        },
        {
          $unwind: "$religionsDetails",
        },
        {
          $lookup: {
            from: "caste_lists",
            localField: "religious_social_background.caste",
            foreignField: "_id",
            as: "casteDetails",
          },
        },
        {
          $unwind: "$casteDetails",
        },
        {
          $lookup: {
            from: "mother_tongues",
            localField: "religious_social_background.mother_tongue",
            foreignField: "_id",
            as: "motherTDetails",
          },
        },
        {
          $unwind: "$motherTDetails",
        },
        {
          $project: {
            _id: 1,
            religion: "$religionsDetails.name",
            caste: "$casteDetails.name",
            mother_tongue: "$motherTDetails.name",
            basic_info: 1,
            physical_attributes: 1,
            education_occupation: 1,
            astro_details: 1,
            documents_photos: 1,
            religious_social_background: 1,
            family_details: 1,
            resedence_details: 1,
            partner_preference: 1,
            gallery_images: 1,
          },
        },
      ];

      const results = await UserModel.aggregate(pipeline);
      if (results && results.length) {
        results[0].religious_social_background.religion = results[0].religion;
        results[0].religious_social_background.caste = results[0].caste;
        results[0].religious_social_background.mother_tongue =
          results[0].mother_tongue;
        delete results[0].religion;
        delete results[0].caste;
        delete results[0].mother_tongue;
      }
      res.status(201).json({
        status: "success",
        data: results && results.length ? results[0] : {},
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
  getMembersProfile: async (req, res, next) => {
    try {
      const isPlanExist = await PaymentModel.findOne({
        user_id: new mongoose.Types.ObjectId(req.user.id),
        expired_at: { $gt: new Date().toISOString() },
        status: "success",
      });
      if (!isPlanExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, You don't have any active plan, please buy a plan first.`,
        });
      }
      const memberId = req?.query?.user_id;
      const pipeline = [
        {
          $match: { _id: new mongoose.Types.ObjectId(memberId) },
        },
        {
          $lookup: {
            from: "religions",
            localField: "religious_social_background.religion",
            foreignField: "_id",
            as: "religionsDetails",
          },
        },
        {
          $unwind: "$religionsDetails",
        },
        {
          $lookup: {
            from: "caste_lists",
            localField: "religious_social_background.caste",
            foreignField: "_id",
            as: "casteDetails",
          },
        },
        {
          $unwind: "$casteDetails",
        },
        {
          $lookup: {
            from: "mother_tongues",
            localField: "religious_social_background.mother_tongue",
            foreignField: "_id",
            as: "motherTDetails",
          },
        },
        {
          $unwind: "$motherTDetails",
        },
        {
          $project: {
            _id: 1,
            religion: "$religionsDetails.name",
            caste: "$casteDetails.name",
            mother_tongue: "$motherTDetails.name",
            basic_info: 1,
            physical_attributes: 1,
            education_occupation: 1,
            astro_details: 1,
            documents_photos: 1,
            religious_social_background: 1,
            family_details: 1,
            resedence_details: 1,
            partner_preference: 1,
            gallery_images: 1,
            email_address: 1,
            mobile: 1,
          },
        },
      ];

      const results = await UserModel.aggregate(pipeline);
      if (results && results.length) {
        const isContactViewed = await ViewedContactsModel.findOne({
          viewed_by: new mongoose.Types.ObjectId(req.user.id),
          viewed_to: new mongoose.Types.ObjectId(memberId),
        });

        results[0].basic_info.height = results[0].physical_attributes.height;
        results[0].basic_info.mother_tongue =
          results[0].religious_social_background.mother_tongue;
        results[0].basic_info.qualification =
          results[0].education_occupation.qualification;
        results[0].basic_info.occupation =
          results[0].education_occupation.occupation;
        results[0].basic_info.annual_income =
          results[0].education_occupation.annual_income;

        if (!isContactViewed) {
          delete results[0].astro_details;
          delete results[0].education_occupation;
          delete results[0].family_details;
          delete results[0].physical_attributes;
          delete results[0].religious_social_background;
          delete results[0].resedence_details;
          results[0].contact_details = {
            email_address: "*****",
            mobile: "*****",
            address: "*****",
          };
        } else {
          results[0].religious_social_background.religion = results[0].religion;
          results[0].religious_social_background.caste = results[0].caste;
          results[0].religious_social_background.mother_tongue =
            results[0].mother_tongue;

          results[0].contact_details = {
            email_address:
              results[0]?.email_address ||
              results[0]?.basic_info?.email_address,
            mobile: results[0]?.basic_info?.mobile || results[0]?.mobile,
            address: results[0]?.resedence_details?.full_address || "",
          };
          console.log(results, results[0]?.email_address);
        }
        delete results[0].religion;
        delete results[0].caste;
        delete results[0].mother_tongue;
        delete results[0].documents_photos.astro_profile;
        delete results[0].documents_photos.govt_document;
        delete results[0].documents_photos._id;
        delete results[0].basic_info.address;
        delete results[0].basic_info._id;
        delete results[0].basic_info.email_address;
        delete results[0].basic_info.mobile;
        delete results[0].email_address;
        delete results[0].mobile;
      }
      res.status(201).json({
        status: "success",
        data: results && results.length ? results[0] : {},
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
  updateProfileImage: async (req, res, next) => {
    try {
      const profileImage = req?.body?.profile_image
      if(!profileImage){
        return res.status(401).json({
          status: "error",
          message: "Profile Image is required field."
        });
      }
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(req.user.id) },
        { $set: {"documents_photos.profile_image": profileImage} }
      );
      res.status(201).json({
        status: "success",
        message: "Profile Image updated successfully.",
      });
    } catch (error) {
      console.log("error:: ", JSON.stringify(error));
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  }
};