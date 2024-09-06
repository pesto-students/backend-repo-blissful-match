const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const modelsSchema = new Schema({
  name: {
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
  /* special_price: {
    type: Decimal128,
  }, */
  show_special_price: {
    type: Boolean,
  },
  website_access: {
    type: Boolean,
  },
  unlimited_profiles: {
    type: Boolean,
  },
  shortlist_profiles: {
    type: Boolean,
  },
  send_messages: {
    type: Boolean,
  },
  advisor: {
    type: Boolean,
  },
  introduction_mettings: {
    type: Boolean,
  },
  handpicked_matches: {
    type: Boolean,
  },
  premium_benefits: {
    type: Boolean,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  updated_at: {
    type: Date,
    default: new Date().toISOString(),
  },
  created_at: {
    type: Date,
    default: new Date().toISOString(),
  },
}, { strict: false });

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

const Plans = mongoose.model("plans", modelsSchema);

module.exports = Plans;
