const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const schemaStructure = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  title: {
    type: String,
  },
  member_name: {
    type: String,
  },
  partner_name: {
    type: String,
  },
  member_email: {
    type: String,
  },
  partner_email: {
    type: String,
  },
  first_meet_date: {
    type: Date,
  },
  wedding_date: {
    type: Date,
  },
  story_description: {
    type: String,
  },
  story_images: {
    type: [
      {
        image_name: String,
      }
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["Published", "Pending"],
    default: "Pending",
  },
  updated_at: {
    type: Date,
    default: new Date().toISOString(),
  },
  created_at: {
    type: Date,
    default: new Date().toISOString(),
  },
});

// Hash password before saving
schemaStructure.pre("save", async function (next) {
  const user = this;
  user.created_at = user.updated_at = new Date().toISOString();
  next();
});
schemaStructure.pre("update", function (next) {
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

const SuccessStories = mongoose.model("success_stories", schemaStructure);
module.exports = SuccessStories;
