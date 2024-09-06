const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const { mongoose } = require('mongoose')
let timestamp = new Date();
timestamp = timestamp.getTime() + timestamp.getTimezoneOffset() * 60000; //to UTC timestamp

module.exports.ensureAuthenticated = async (req, res, next) => {
  const token = req.headers["authorization"];
  //console.log("token checking....", JSON.stringify(token))
  if (token) {
    jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name == "TokenExpiredError") {
          return res
            .status(401)
            .json({
              status: "error",
              message: "Unauthorized access.",
              tokenExpired: true,
            });
        } else {
          console.log(err);
          return res
            .status(401)
            .json({ status: "error", message: "Unauthorized access." });
        }
      }
      req.decoded = decoded;
      try {
        const objectId = new mongoose.Types.ObjectId(decoded.id);
        const userDetails = await User.findOne({ _id: objectId});

        let currentUser = [];
        if (Object.keys(userDetails).length > 0) {
          currentUser = {
            id: userDetails?._id || "",
            first_name: userDetails?.first_name || "",
            middle_name: userDetails?.middle_name || "",
            last_name: userDetails?.last_name || "",
            email_address: userDetails?.email_address || "",
            profile_image: userDetails?.profile_image || "",
            gender: userDetails?.gender || "",
          };
        }
        req.user = currentUser;
        next();
      } catch (error) {
        console.log("error ", JSON.stringify(error));
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized access." });
      }
    });
  } else {
    console.log("Failing here no token");
    res.status(401).send({ status: "error", message: "Unauthorized access." });
  }
};

module.exports.optionallyAuthenticated = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (token) {
    jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
      if (err) {
        next();
      } else {
        req.decoded = decoded;
        if (req.decoded) {
          try {
            const objectId = new mongoose.Types.ObjectId(decoded.id);
            const userDetails = await User.findOne({ _id: objectId});
            var currentUser = [];
            if (Object.keys(userDetails).length > 0) {
              currentUser = {
                id: userDetails?._id || "",
                first_name: userDetails?.first_name || "",
                middle_name: userDetails?.middle_name || "",
                last_name: userDetails?.last_name || "",
                email_address: userDetails?.email_address || "",
                profile_image: userDetails?.profile_image || "",
                gender: userDetails?.gender || "",
              };
            }
            req.user = currentUser;
            next();
          } catch (error) {
            console.log("error ", JSON.stringify(error));
            return res
              .status(401)
              .json({ status: "error", message: "Unauthorized access." });
          }
        } else {
          next();
        }
      }
    });
  } else {
    next();
  }
};
