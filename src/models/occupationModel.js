const { mongoose } = require("mongoose");
const Schema = mongoose.Schema;

const occupationSchema = new Schema({
  name: {
    type: String,
  },
  category: {
    type: String,
    enum: [
      "PRIVATE SECTOR",
      "GOVERNMENT / PUBLIC SECTOR",
      "CIVIL SERVICES",
      "DEFENCE",
      "BUSINESS",
      "SELF EMPLOYED",
      "NOT WORKING",
    ],
    default: "GOVERNMENT / PUBLIC SECTOR",
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
});

// Hash password before saving
occupationSchema.pre("save", async function (next) {
  const record = this;
  record.created_at = record.updated_at = new Date().toISOString();
  next();
});
occupationSchema.pre("update", function (next) {
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

const Occupations = mongoose.model("occupation_lists", occupationSchema);
module.exports = Occupations;