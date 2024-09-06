const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const modelsSchema = new Schema({
  viewed_by: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  viewed_to: {
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

const ViewedContacts = mongoose.model("viewed_contacts", modelsSchema);

module.exports = ViewedContacts;
