const { mongoose } = require('mongoose')
const Schema = mongoose.Schema
  
const regionSchema  = new Schema({
    name: {
        type: String
    },
    type: {
        type: String,
        enum: ["MORE", "FREQUENTLY USED"],
        default: "MORE"
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    updated_at: {
        type: Date,
        default: new Date().toISOString()
    },
    created_at: {
        type: Date,
        default: new Date().toISOString()
    }
})

// Hash password before saving
regionSchema.pre('save', async function (next) {
    const user = this
    user.created_at = user.updated_at = new Date().toISOString();
    next();
});
regionSchema.pre('update', function (next) {
    this.update({}, {
        $set: {
            updated_at: new Date().toISOString()
        }
    })
    next()
})

const MotherTongues = mongoose.model("mother_tongues", regionSchema);  
module.exports = MotherTongues