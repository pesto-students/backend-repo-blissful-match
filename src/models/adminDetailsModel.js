const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const modelsSchema = new Schema(
  {
    address: {
      type: String,
    },
    contact_numbers: {
      type: String,
    },
    timings: {
      type: String,
    },
    email: {
      type: String,
    },
    /* longitude: {
    type: Double,
  },
  latitude: {
    type: Double,
  }, */
    insta_link: {
      type: String,
    },
    twitter_link: {
      type: String,
    },
    facebook_link: {
      type: String,
    },
    youtube_link: {
      type: String,
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

const AdminDetails = mongoose.model("admin_contact_details", modelsSchema);

module.exports = AdminDetails;
