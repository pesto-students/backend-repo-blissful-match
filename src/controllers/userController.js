const UserModel = require("../models/userModel");
const ShortlistedUsersModel = require("../models/shortlistedUserModel");
const CasteModel = require("../models/casteModel");
const ReligionModel = require("../models/religionModel");
const MotherToungeModel = require("../models/motherTongueModel");
const PaymentModel = require("../models/paymentModel");
const ViewedContactsModel = require("../models/viewedDetailsModel");
const jwt = require("jsonwebtoken");
const config = require("../config/3-config");
const bcrypt = require("bcryptjs");
const moment = require("moment");

const {
  buildQueryFilter,
  sendEmail,
  validatePassword,
  isValidDate,
  removeEmptyObjects,
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
      const isValidDateOfBirth = await isValidDate(postData.date_of_birth);
      if (!isValidDateOfBirth) {
        return res.status(401).json({
          status: "error",
          message:
            "Date of Birth is invalid, it should be in YYYY-MM-DD format (Ex: 2024-08-31)",
        });
      }
      const isValidPassword = await validatePassword(postData.password);
      if (!isValidPassword.valid) {
        return res.status(401).json({
          status: "error",
          message: isValidPassword.message,
        });
      }
      const basic_info = {
        first_name: postData?.first_name || "",
        last_name: postData?.last_name || "",
        email_address: postData?.email_address.toLowerCase() || "",
        mobile: postData?.mobile || "",
      };
      const astro_details = {
        date_of_birth: postData?.date_of_birth || "",
      };
      const physical_attributes = {
        gender: postData?.gender || "",
      };
      const religious_social_background = {
        religion: postData?.religion || "",
        caste: postData?.caste || "",
      };
      const registerReq = {
        basic_info,
        astro_details,
        physical_attributes,
        religious_social_background,
        password: postData.password,
      };

      if (postData?.religion) {
        const isReligionExist = await ReligionModel.findOne({
          _id: new mongoose.Types.ObjectId(postData?.religion),
        });
        if (!isReligionExist) {
          return res.status(401).json({
            status: "error",
            message: `Sorry, Invalid Religion`,
          });
        }
        if (postData?.caste) {
          const isCasteExist = await CasteModel.findOne({
            _id: new mongoose.Types.ObjectId(postData?.caste),
            religion: new mongoose.Types.ObjectId(postData?.religion),
          });
          if (!isCasteExist) {
            return res.status(401).json({
              status: "error",
              message: `Sorry, Invalid Caste`,
            });
          }
        }
      }

      await UserModel.create(registerReq);
      //send OTP in email
      const mailOptions = {
        from: `${config.PROJECT_NAME}<${config.SMTP_ADMIN_EMAIL}>`,
        to: postData?.email_address,
        subject: `Welcome to ${config.PROJECT_NAME} - Start Your Journey to Find Your Perfect Match!`,
        html: `<p>Dear ${postData.first_name},</p>
<p>We're thrilled to welcome you to ${config.PROJECT_NAME}! 🎉</p>
<p>Thank you for joining our community. We are dedicated to helping you find your ideal partner, and we're excited to support you on this meaningful journey.</p>
<p>Here's what you can do to get started:</p>
<ul>
<li><b>Complete Your Profile</b>: Share more about yourself to help others get to know you better. The more details you provide, the better the matches we can suggest!</li>
<li><b>Browse Profiles</b>: Start exploring potential matches based on your preferences and interests.</li>
<li><b>Update Your Preferences</b>: Customize your search criteria to find someone who truly aligns with your values and desires.</li>
<li><b>Read Our Tips & Guidelines</b>: Discover tips and advice on making the most of your experience and navigating the world of online matrimony.</li>
<li><b>Get Support</b>: Our support team is here to assist you with any questions or concerns you may have. Feel free to reach out at ${config.SMTP_FROM_EMAIL}.</li>
</ul>
<p>To get the most out of ${config.PROJECT_NAME}, don't forget to:</p>
<ul>
<li>Set up your profile picture.</li>
<li>Verify your email address (if not done already) to enhance your security.</li>
<li>Explore our premium features for an even more tailored experience.</li>
</ul>
<p>We're here to support you every step of the way, and we look forward to helping you find a meaningful connection.</p><br />Warm Regards,<br />${config.PROJECT_NAME} Team`,
      };
      await sendEmail(mailOptions);
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
      const user = await UserModel.findOne({
        "basic_info.email_address": email_address,
      });
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
      console.log(req.user);
      const page = parseInt(req.body.currentPage) || 1;
      const limit = parseInt(req.body.pageSize) || 10;
      const skip = (page - 1) * limit;

      // Search filter
      const search = req.body.search || {};
      const query = {};

      query["status"] = "Active";

      if (search?.gender) {
        query["physical_attributes.gender"] = search?.gender;
      }
      if (req.user) {
        console.log("User id ", req.user.id);
        query["physical_attributes.gender"] =
          req.user.gender == "Male" ? "Female" : "Male";
        query["_id"] = { $ne: req.user.id };
      }
      if (search?.height?.min && !search?.height?.max) {
        query["physical_attributes.height"] = { $gte: search.height.min };
      }
      if (!search?.height?.min && search?.height?.max) {
        query["physical_attributes.height"] = { $lte: search.height.max };
      }
      if (search?.height?.min && search?.height?.max) {
        query["physical_attributes.height"] = {
          $gte: search.height.min,
          $lte: search.height.max,
        };
      }
      if (search?.maritial_status) {
        query["basic_info.maritial_status"] = search?.maritial_status;
      }
      if (search?.age?.min && !search?.age?.max) {
        query["basic_info.age"] = { $gte: search.age.min };
      }
      if (!search?.age?.min && search?.age?.max) {
        query["basic_info.age"] = { $lte: search.age.max };
      }
      if (search?.age?.min && search?.age?.max) {
        query["basic_info.age"] = {
          $gte: search.age.min,
          $lte: search.age.max,
        };
      }
      if (search?.religion) {
        query["religious_social_background.religion"] = search.religion;
      }
      if (search?.caste) {
        query["religious_social_background.caste"] = search?.caste;
      }
      if (search?.caste_category) {
        query["religious_social_background.caste_category"] =
          search?.caste_category;
      }
      if (search?.mother_tongue) {
        query["religious_social_background.mother_tongue"] =
          search?.mother_tongue;
      }
      if (search?.country) {
        query["resedence_details.country"] = search?.country;
      }
      if (search?.state) {
        query["resedence_details.state"] = search?.state;
      }
      if (search?.city) {
        query["resedence_details.city"] = search?.city;
      }
      if (search?.education) {
        query["education_occupation.qualification"] = search?.education;
      }
      if (search?.mangal) {
        query["astro_details.is_manglik"] = search?.mangal;
      }
      //console.log(query);

      const pipeline = [
        {
          $match: query,
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
          $unwind: {
            path: "$religionsDetails",
            preserveNullAndEmptyArrays: true,
          },
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
          $unwind: {
            path: "$casteDetails",
            preserveNullAndEmptyArrays: true,
          },
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
          $unwind: {
            path: "$motherTDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            user_id: "$_id",
            first_name: "$basic_info.first_name",
            last_name: "$basic_info.last_name",
            date_of_birth: "$astro_details.date_of_birth",
            gender: "$physical_attributes.gender",
            height: "$physical_attributes.height",
            sub_caste: "$religious_social_background.caste_category",
            religion: "$religionsDetails.name",
            mother_tongue: "$motherTDetails.name",
            email_address: "$basic_info.email_address",
            mobile: "$basic_info.mobile",
            occupation: "$education_occupation.occupation",
            qualification: "$education_occupation.qualification",
            annual_income: "$education_occupation.annual_income",
            age: "$basic_info.age",
            caste: "$casteDetails.name",
            full_address: "$resedence_details.full_address",
            location: "$resedence_details.city",
            profile_image: "$documents_photos.profile_image",
            maritial_status: "$basic_info.maritial_status",
            isLiked: true,
            status: "$status",
          },
        },
      ];

      const results = await UserModel.aggregate(pipeline)
        .skip(skip)
        .sort({ created_at: -1 })
        .limit(limit);
      //console.log(results);

      const count = await UserModel.countDocuments(query).exec();

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
          $match: {
            shortlisted_by: req.user.id,
          },
        },
        {
          $lookup: {
            from: "users",
            let: {
              shortlisted_by: "$shortlisted_by",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$shortlisted_by"],
                  },
                },
              },
            ],
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "religions",
            localField: "userDetails.religious_social_background.religion",
            foreignField: "_id",
            as: "religionsDetails",
          },
        },

        {
          $unwind: {
            path: "$religionsDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "caste_lists",
            localField: "userDetails.religious_social_background.caste",
            foreignField: "_id",
            as: "casteDetails",
          },
        },

        {
          $unwind: {
            path: "$casteDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            user_id: "$userDetails._id",
            first_name: "$userDetails.basic_info.first_name",
            last_name: "$userDetails.basic_info.last_name",
            date_of_birth: "$userDetails.astro_details.date_of_birth",
            gender: "$userDetails.physical_attributes.gender",
            height: "$userDetails.physical_attributes.height",
            sub_caste:
              "$userDetails.religious_social_background.caste_category",
            religion: "$religionsDetails.name",
            email_address: "$userDetails.basic_info.email_address",
            mobile: "$userDetails.basic_info.mobile",
            occupation: "$userDetails.education_occupation.occupation",
            qualification: "$userDetails.education_occupation.qualification",
            annual_income: "$userDetails.education_occupation.annual_income",
            age: "$userDetails.basic_info.age",
            caste: "$casteDetails.name",
            mother_tongue:
              "$userDetails.religious_social_background.mother_tongue",
            full_address: "$userDetails.resedence_details.full_address",
            location: "$userDetails.resedence_details.city",
            profile_image: "$userDetails.documents_photos.profile_image",
            maritial_status: "$userDetails.basic_info.maritial_status",
            isLiked: true,
            status: "$userDetails.status",
          },
        },
      ];

      const results = await ShortlistedUsersModel.aggregate(pipeline)
        .skip(skip)
        .sort({ created_at: -1 })
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
        "basic_info.email_address": rewParams.email,
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
        to: isExist.basic_info.email_address,
        subject: "Your Blissful Match password information",
        html:
          "Hi " +
          isExist.basic_info.first_name +
          " " +
          isExist.basic_info.last_name +
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
        "basic_info.email_address": rewParams.email,
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
        "basic_info.email_address": postData.email,
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
      if (!isSamePassword) {
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
      const isAlreadyViewd = await UserModel.findOne({
        viewed_by: new mongoose.Types.ObjectId(req.user.id),
        viewed_to: new mongoose.Types.ObjectId(postData.memberId),
      });

      if (isAlreadyViewd) {
        req.query.user_id = postData.memberId;
        module.exports.getMembersProfile(req, res, next);
      } else {
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
        const remainBalance = parseInt(
          isPlanExist.remaining_contact_view_limit
        );
        if (remainBalance > 0) {
          const date = moment();
          const formattedDate = date.format("YYYY-MM-DD");
          const formattedTime = date.format("HH:mm A");

          const viewed_at_date = formattedDate;
          const viewed_at_time = formattedTime;
          const insertData = {
            viewed_by: req.user.id,
            viewed_to: postData.memberId,
            viewed_at_date,
            viewed_at_time,
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
          req.query.user_id = postData.memberId;
          module.exports.getMembersProfile(req, res, next);
        } else {
          return res.status(401).json({
            status: "error",
            message:
              "Sorry, you have used all contact view balance, please buy a new plan.",
          });
        }
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
          $addFields: {
            compositeKey: {
              $concat: [
                { $toString: "$viewed_by" },
                "-",
                { $toString: "$viewed_to" },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "shortlisted_users",
            //localField: "compositeKey",
            //foreignField: "compositeKey",
            let: { viewedTo: "$viewed_to", viewedBy: "$viewed_by" },
            as: "shortListDetails",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$shortlisted_to", "$$viewedTo"] },
                      { $eq: ["$shortlisted_by", "$$viewedBy"] },
                    ],
                  },
                },
              },
            ],
          },
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
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            created_at: 1,
            viewed_at_date: 1,
            viewed_at_time: 1,
            isShortListed: {
              $cond: {
                if: { $eq: [{ $size: "$shortListDetails" }, 0] }, // Check if size is 0
                then: false, // If size is 0, return false
                else: true, // Otherwise, return true
              },
            },
            user_id: "$userDetails._id",
            about_me: "$userDetails.basic_info.about_me",
            first_name: "$userDetails.basic_info.first_name",
            last_name: "$userDetails.basic_info.last_name",
            date_of_birth: "$userDetails.astro_details.date_of_birth",
            gender: "$userDetails.physical_attributes.gender",
            email_address: "$userDetails.basic_info.email_address",
            mobile: "$userDetails.basic_info.mobile",
            qualification: "$userDetails.education_occupation.qualification",
            annual_income: "$userDetails.education_occupation.annual_income",
            age: "$userDetails.basic_info.age",
            full_address: "$userDetails.resedence_details.full_address",
            profile_image: "$userDetails.documents_photos.profile_image",
            maritial_status: "$userDetails.basic_info.maritial_status",
            location: "$userDetails.resedence_details.city",
            status: "$userDetails.status",
          },
        },
      ];
      //console.log(pipeline)
      const results = await ViewedContactsModel.aggregate(pipeline)
        .skip(skip)
        .sort({ created_at: -1 })
        .limit(limit);

      const count = await ViewedContactsModel.countDocuments({
        viewed_by: req.user.id,
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
      /* const isCasteExist = await CasteModel.findOne({
        _id: new mongoose.Types.ObjectId(
          postData?.religious_social_background?.caste
        ),
      });  */
      const isCasteExist = await CasteModel.findOne({
        name: postData?.religious_social_background?.caste,
      });
      if (!isCasteExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, Invalid Caste`,
        });
      }
      postData.religious_social_background.religion = isCasteExist.religion;
      postData.religious_social_background.caste = isCasteExist._id;

      /* if (
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
        ); */

      postData.basic_info.email_address = req.user.email_address;

      delete postData.religious_social_background.mother_tongue;
      delete postData._id;
      delete postData.documents_photos._id;
      delete postData.family_details._id;
      delete postData.partner_preference._id;
      delete postData.partner_preference.height._id;
      delete postData.partner_preference.weight._id;
      delete postData.partner_preference.age._id;
      delete postData.resedence_details._id;
      delete postData.basic_info._id;
      delete postData.physical_attributes._id;
      delete postData.astro_details._id;
      delete postData.religious_social_background._id;

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
          $match: { _id: new mongoose.Types.ObjectId(req.user.id) },
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
          $unwind: {
            path: "$religionsDetails",
            preserveNullAndEmptyArrays: true,
          },
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
          $unwind: { path: "$casteDetails", preserveNullAndEmptyArrays: true },
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
          $unwind: {
            path: "$motherTDetails",
            preserveNullAndEmptyArrays: true,
          },
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
      console.log("memberId", memberId);
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
          $unwind: {
            path: "$religionsDetails",
            preserveNullAndEmptyArrays: true,
          },
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
          $unwind: { path: "$casteDetails", preserveNullAndEmptyArrays: true },
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
          $unwind: {
            path: "$motherTDetails",
            preserveNullAndEmptyArrays: true,
          },
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
      console.log(pipeline);
      const results = await UserModel.aggregate(pipeline);
      console.log("results", results);
      if (results && results.length) {
        const isContactViewed = await ViewedContactsModel.findOne({
          viewed_by: new mongoose.Types.ObjectId(req.user.id),
          viewed_to: new mongoose.Types.ObjectId(memberId),
        });
        console.log(isContactViewed);
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
      console.log(results);
      return res.status(201).json({
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
      const profileImage = req?.body?.profile_image;
      if (!profileImage) {
        return res.status(401).json({
          status: "error",
          message: "Profile Image is required field.",
        });
      }
      await UserModel.updateOne(
        { _id: new mongoose.Types.ObjectId(req.user.id) },
        { $set: { "documents_photos.profile_image": profileImage } }
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
  },
};
