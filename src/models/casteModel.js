const { mongoose } = require('mongoose')
const Schema = mongoose.Schema
  
const regionSchema  = new Schema({
    name: {
        type: String
    },
    religion: { 
        type: Schema.Types.ObjectId, 
        ref: 'religions',
        required: true
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

const Regions = mongoose.model("caste_list", regionSchema);  
module.exports = Regions