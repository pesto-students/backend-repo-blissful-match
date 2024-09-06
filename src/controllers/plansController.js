const config = require("../config/config.js");
const UsersModel = require("../models/userModel.js");
const PlansModel = require("../models/plansModel");
const PaymentModel = require("../models/paymentModel.js");
const ViewedDetailsModel = require("../models/viewedDetailsModel.js");
const { buildQueryFilter, sendEmail } = require("../utils/helpers");
const { mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: config.RAZORPAY_ID,
  key_secret: config.RAZORPAY_SECRET_KEY,
});

module.exports = {
  getPLans: async (req, res, next) => {
    try {
      const page = parseInt(req.query.currentPage) || 1;
      const limit = parseInt(req.query.pageSize) || 100;
      const skip = (page - 1) * limit;

      // Search filter
      const search = req.body.search || {status : "Active"};

      // Fields to include or exclude
      /* let defaultIncludeFields = "_id,name";
      defaultIncludeFields = defaultIncludeFields.split(",").join(" ");
      const fields = defaultIncludeFields; */
      const query = {
        $and: await buildQueryFilter(search),
      };

      const plans = await PlansModel.find(query)
        .skip(skip)
        .limit(limit)
        /* .select(fields) */
        .exec();

      const count = await PlansModel.countDocuments(query).exec();

      res.json({
        status: "success",
        data: plans,
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
  generateOrder: async (req, res, next) => {
    try {
      const planId = req?.body?.plan_id;
      if (!planId) {
        res
          .status(401)
          .json({ status: "error", message: "Plan ID is required." });
        return;
      }

      const isPlanExist = await PlansModel.findOne({
        _id: new mongoose.Types.ObjectId(planId),
      });
      if (!isPlanExist) {
        return res.status(401).json({
          status: "error",
          message: `Sorry, this plan is not exist. please contact to our support team.`,
        });
      }
      const orderPromise = instance.orders.create({
        amount: isPlanExist.amount * 100,
        currency: "INR",
        receipt: "BM_" + uuidv4(),
        payment_capture: true,
        notes: { userId: req.user.id.toString() },
      });
      orderPromise
        .then(async function (orderResult) {
          const planExpiry = isPlanExist.validity.match(/^\d+/);
          const date = new Date();
          const planExpiryDuration = planExpiry
            ? parseInt(planExpiry[0], 10)
            : null;
          const paymentData = {
            plan_id: isPlanExist._id,
            plan_name: isPlanExist.name,
            validity: isPlanExist.validity,
            amount: isPlanExist.amount,
            contact_limit: isPlanExist.contact_limit,
            remaining_contact_view_limit: isPlanExist.contact_limit,
            expired_at: new Date(
              date.setMonth(date.getMonth() + planExpiryDuration)
            ).toISOString(),
            user_id: req.user.id,
            order_id: orderResult.id,
            razorpay_order_data: orderResult,
          };
          await PaymentModel.create(paymentData);
          const fullName =
            req.user.first_name +
            " " +
            req.user.middle_name +
            " " +
            req.user.last_name;
          res.status(201).json({
            status: "success",
            message: "Order created successfully.",
            orderid: orderResult.id,
            emailAddress: req.user.email_address,
            mobileNumber: req.user.mobile,
            fullName: fullName,
            amount: paymentData.amount,
            currency: "INR",
          });
        })
        .catch(function (err) {
          res
            .status(401)
            .json({ status: "error", message: err?.error?.description });
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
  verifySignature: async (req, res, next) => {
    try {
      const postData = req.body;
      if (!postData?.order_id) {
        return res
          .status(401)
          .json({ status: "error", message: "Order ID is required." });
      }
      if (!postData?.payment_id) {
        return res
          .status(401)
          .json({ status: "error", message: "Payment ID is required." });
      }

      const hmac = crypto.createHmac("sha256", config.RAZORPAY_SECRET_KEY);
      hmac.update(postData.order_id + "|" + postData.payment_id);
      var signature = hmac.digest("hex");
      var paymentParams = {};
      if (signature == postData.signature) {
        paymentParams = {
          razorpay_payment_id: postData.payment_id,
          status: "success",
        };
      } else {
        paymentParams = {
          status: "failed",
        };
      }
      console.log(paymentParams);
      const isOrderExist = await PaymentModel.findOne({
        order_id: postData.order_id,
      });
      if (!isOrderExist) {
        return res.status(401).json({
          status: "error",
          message: `Payment details not found.`,
        });
      }
      const updatedPaymentStatus = await PaymentModel.findByIdAndUpdate(
        isOrderExist._id,
        paymentParams,
        { new: true }
      );

      if (!updatedPaymentStatus) {
        console.log("Payment details not found");
        return res.status(401).json({
          status: "error",
          message: "There is some problem updating the payment status",
        });
      }
      if (paymentParams.status == "success") {
        const updateUser = await UsersModel.findByIdAndUpdate(
          req.user.id,
          { id_paid_user: 1 },
          { new: true }
        );
        if (!updateUser) {
          console.log("User details not found");
          return res.status(401).json({
            status: "error",
            message: "There is some problem updating the user status",
          });
        }
        //Send Email to admin regarding payment success
        const mailOptions = {
          from: `Blissful Match<${config.SMTP_ADMIN_EMAIL}>`,
          to: config.SMTP_ADMIN_EMAIL,
          subject: "Payment successful",
          html:
            "Hello Admin," +
            "<br /><br />Payment of Rs. " +
            updatedPaymentStatus.amount +
            " is successfully done by " +
            req.user.first_name +
            " " +
            req.user.middle_name +
            " " +
            req.user.last_name +
            " for the " +
            updatedPaymentStatus.plan_name +
            " plan.<br /><br />Warm Regards,<br />Blissful Match Team",
        };
        let emailResult = await sendEmail(mailOptions);
        // Delete users by status
        const deletedViewedContacts = await ViewedDetailsModel.deleteMany({ viewed_by: req.user.id });

        console.log("Number of users deleted:", deletedViewedContacts.deletedCount);
        res
          .status(201)
          .json({ status: "success", message: "Payment is successful." });
      } else {
        res.status(401).json({
          status: "error",
          message: "Your Payment is failed, please contact to support team.",
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
  }
};
