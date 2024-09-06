const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const modelsSchema = new Schema({
  shortlisted_by: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  shortlisted_to: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
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

const ShortlistedUsers = mongoose.model("shortlisted_users", modelsSchema);

module.exports = ShortlistedUsers;
