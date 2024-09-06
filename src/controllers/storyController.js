const StoryModel = require("../models/storyModel.js");

const {
  buildQueryFilter,
  sendEmail,
  isValidDate,
  isDateBeforeTodayOrGivenDate,
} = require("../utils/helpers");
const { mongoose } = require("mongoose");
const fs = require("fs").promises;
const filePath = "../plans.json";

module.exports = {
  addStory: async (req, res, next) => {
    const postData = req.body;
    const requiredFileds = {
      member_name: "Member's Name",
      member_email: "Member's Email",
      partner_name: "Partner's Name",
      partner_email: "Partner's Email",
      first_meet_date: "First Meet Date",
      wedding_date: "Wedding Date",
      story_description: "Story Description",
      story_images: "Story Images",
    };

    // Find keys from requiredFields that are missing or have blank values in request
    const issues = Object.keys(requiredFileds).filter((key) => {
      // Check if the key is not present in request or has a blank value
      return (
        !(key in postData) ||
        !postData[key].length ||
        (typeof postData[key] == "string" && postData[key].trim() === "")
      );
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
    const isValidMeetDate = await isValidDate(postData["first_meet_date"]);
    if (!isValidMeetDate) {
      return res.status(401).json({
        status: "error",
        message:
          "First Meet Date is invalid, it should be in YYYY-MM-DD format (Ex: 2024-08-31)",
      });
    }

    const isValidWeddingDate = await isValidDate(postData["wedding_date"]);
    if (!isValidWeddingDate) {
      return res.status(401).json({
        status: "error",
        message:
          "Wedding Date is invalid, it should be in YYYY-MM-DD format (Ex: 2024-08-31)",
      });
    }
    const isValidCombination = await isDateBeforeTodayOrGivenDate(
      postData["first_meet_date"],
      postData["wedding_date"]
    );

    if (!isValidCombination) {
      return res.status(401).json({
        status: "error",
        message: "First Meet Date should be greater than Wedding Date.",
      });
    }
    postData.user_id = req.user.id;
    let result = await StoryModel.create(postData);
    return res.status(201).json({
      status: "success",
      message: `Story added successfully`,
      items: result,
    });
  },
  updateStory: async (req, res, next) => {
    const postData = req.body;
    const isExist = await StoryModel.findOne({
      user_id: req.user.id,
    });
    if (!Object.keys(postData).length) {
      return res.status(401).json({
        status: "error",
        message: "No data found to update.",
      });
    }
    const requiredFileds = {
      member_name: "Member's Name",
      member_email: "Member's Email",
      partner_name: "Partner's Name",
      partner_email: "Partner's Email",
      first_meet_date: "First Meet Date",
      wedding_date: "Wedding Date",
      story_description: "Story Description",
      story_images: "Story Images",
    };

    // Find keys from requiredFields that are missing or have blank values in request
    const issues = Object.keys(requiredFileds).filter((key) => {
      // Check if the key is not present in request or has a blank value
      return (
        (postData[key] && !postData[key]?.length) ||
        (typeof postData[key] == "string" && postData[key].trim() === "")
      );
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
    const isValidMeetDate = await isValidDate(postData["first_meet_date"]);
    if (postData["first_meet_date"] && !isValidMeetDate) {
      return res.status(401).json({
        status: "error",
        message:
          "First Meet Date is invalid, it should be in YYYY-MM-DD format (Ex: 2024-08-31)",
      });
    }

    const isValidWeddingDate = await isValidDate(postData["wedding_date"]);
    if (postData["wedding_date"] && !isValidWeddingDate) {
      return res.status(401).json({
        status: "error",
        message:
          "Wedding Date is invalid, it should be in YYYY-MM-DD format (Ex: 2024-08-31)",
      });
    }
    const isValidCombination = await isDateBeforeTodayOrGivenDate(
      postData["first_meet_date"] || isExist.first_meet_date,
      postData["wedding_date"] || isExist.wedding_date
    );

    if (!isValidCombination) {
      return res.status(401).json({
        status: "error",
        message: "First Meet Date should be greater than Wedding Date.",
      });
    }
    await StoryModel.updateOne(
      { _id: new mongoose.Types.ObjectId(isExist._id) },
      {
        $set: postData,
      }
    );
    let result = await StoryModel.findOne({
      user_id: req.user.id,
    });
    return res.status(201).json({
      status: "success",
      message: `Story updated successfully`,
      items: result,
    });
  },
  upsertStory: async (req, res, next) => {
    try {
      const isExist = await StoryModel.findOne({
        user_id: req.user.id,
      });
      if (!isExist) {
        module.exports.addStory(req, res, next);
      } else {
        module.exports.updateStory(req, res, next);
      }
    } catch (error) {
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  getMyStory: async (req, res, next) => {
    try {
      const isExist = await StoryModel.findOne({
        user_id: req.user.id,
      });
      if (!isExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, you don't have any success story.`,
        });
      } else {
        return res.status(201).json({
          status: "success",
          message: `Story found successfully`,
          items: isExist,
        });
      }
    } catch (error) {
      res.status(401).json({
        status: "error",
        message:
          error?.message || "There is some problem, please try again later.",
      });
    }
  },
  getPublishedStory: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 10;
      const skip = (page - 1) * limit;

      // Search filter
      const search = { status: "Published" };
      const query = {
        $and: await buildQueryFilter(search),
      };

      const successStories = await StoryModel.find(query)
        .skip(skip)
        .limit(limit)
        .exec();

      const count = await StoryModel.countDocuments(query).exec();

      res.json({
        status: "success",
        data: successStories,
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
  deleteMyStory: async (req, res, next) => {
    try {
      const result = await StoryModel.deleteOne({ user_id: req.user.id });
      if(!result.deletedCount){
        const response = {
          status: "error",
          message: "Sorry, you don't have any story.",
        };
        return res.status(201).json(response);
      }
      console.log("Deleted Count:", result.deletedCount);
      const response = {
        status: "success",
        message: "Story deleted successfully",
      };
      return res.status(201).json(response);
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
