const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const modelsSchema = new Schema(
  {
    plan_id: {
      type: Schema.Types.ObjectId,
      ref: "plans",
      required: true,
    },
    plan_name: {
      type: String,
    },
    validity: {
      type: String,
    },
    /*  amount: {
    type: Decimal128,
  }, */
    contact_limit: {
      type: Number,
    },
    remaining_contact_limit: {
      type: Number,
    },
    previous_balance: {
      type: Number,
    },
    payment_method: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Online",
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    order_id: {
      type: String,
    },
   /*  razorpay_order_data: {
      type: Boolean,
    }, */
    razorpay_payment_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    razorpay_error: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Created", "Success", "Failed"],
      default: "Created",
    },
    expired_at: {
      type: Date,
    },
    updated_at: {
      type: Date,
      default: new Date().toISOString(),
    },
    created_at: {
      type: Date,
      default: new Date().toISOString(),
    },
  },
  { strict: false }
);

// Hash password before saving
modelsSchema.pre("save", async function (next) {
  const user = this;
  user.created_at = user.updated_at = new Date().toISOString();
  next();
});
modelsSchema.pre("update", function (next) {
  this.update(
    {},
    {
      $set: {
        updated_at: new Date().toISOString(),
      },
    }
  );
  next();
});

const Plans = mongoose.model("payments", modelsSchema);

module.exports = Plans;
