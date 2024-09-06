const { mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  basic_info: {
    type: {
      first_name: {
        type: String,
      },
      last_name: {
        type: String,
      },
      email_address: {
        type: String,
        required: true,
        unique: true,
      },
      mobile: {
        type: Number,
        required: true,
        unique: true,
      },
      age: {
        type: Number,
      },
      address: {
        type: String,
      },
      maritial_status: {
        type: String,
        enum: [
          "WIDOW",
          "MARRIED",
          "UNMARRIED",
          "DIVORCEE",
          "WIDOWER",
          "AWAITING DIVORCE",
          "SEPARATED",
        ],
        default: "UNMARRIED",
      },
      have_children: {
        type: String,
        enum: ["No", "Yes, living together", "Yes, living separately"],
        default: "No",
      },
      no_of_children: {
        type: String,
        enum: ["0", "1", "2", "3", "4 and More"],
      },
      hobbies_intrest: {
        type: String,
      },
      about_me: {
        type: String,
      },
    },
  },
  physical_attributes: {
    type: {
      height: {
        type: Number,
      },
      weight: {
        type: Number,
      },
      gender: {
        type: String,
        enum: ["Male", "Female"],
      },
      blood_group: {
        type: String,
        enum: [
          "O-positive (O+)",
          "O-negative (O-)",
          "A-positive (A+)",
          "A-negative (A-)",
          "B-positive (B+)",
          "B-negative (B-)",
          "AB-positive (AB+)",
          "AB-negative (AB-)",
        ],
      },
      complexion: {
        type: String,
        enum: [
          "FAIR",
          "VERY FAIR",
          "DARK",
          "WHEATISH",
          "WHEATISH MEDIUM",
          "WHEATISH BROWN",
        ],
      },
      body_type: {
        type: String,
        enum: ["SLIM", "AVERAGE", "HEAVY", "ATHLETIC"],
      },
      spectacles: {
        type: String,
        enum: ["Yes", "No"],
      },
      smoke: {
        type: String,
        enum: ["Yes", "No", "Occasionally"],
      },
      drink: {
        type: String,
        enum: ["Yes", "No", "Occasionally"],
      },
      diet: {
        type: String,
        enum: [
          "EGGETARIAN",
          "JAIN",
          "NON-VEG",
          "OCCASIONALLY NON-VEG",
          "VEG",
          "VEGAN",
        ],
      },
      physical_status: {
        type: String,
        enum: ["Normal", "Disabled"],
      },
      disabled_reason: {
        type: String,
      },
    },
  },
  education_occupation: {
    qualification: {
      type: String,
    },
    occupation: {
      type: String,
    },
    annual_income: {
      type: String,
      enum: [
        "BELOW 1 Lakh",
        "1 Lakhs",
        "1-2 Lakhs",
        "2-3 Lakhs",
        "3-4 Lakhs",
        "4-5 Lakhs",
        "5-6 Lakhs",
        "6-7 Lakhs",
        "7-8 Lakhs",
        "8-9 Lakhs",
        "9-10 Lakhs",
        "10-12 Lakhs",
        "12-14 Lakhs",
        "14-16 Lakhs",
        "16-20 Lakhs",
        "20-25 Lakhs",
        "25-30 Lakhs",
        "30-35 Lakhs",
        "35-40 Lakhs",
        "40-45 Lakhs",
        "45-50 Lakhs",
        "50-60 Lakhs",
        "60-70 Lakhs",
        "70-80 Lakhs",
        "80-90 Lakhs",
        "90-Lakhs to 1 Crore",
        "1 Crore & Above",
        "No Income",
        "DON'T WISH TO SPECIFY",
        "ANY",
      ],
    },
    employed_in: {
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
    },
    working_with_company: {
      type: String,
    },
  },
  astro_details: {
    date_of_birth: {
      type: Date,
      default: new Date().toISOString(),
    },
    birth_time: {
      type: String,
    },
    place_of_birth: {
      type: String,
    },
    rashi: {
      type: String,
      enum: [
        "ARIES (MESH)",
        "TAURUS (VARISHABH)",
        "GEMINI (MITHUN)",
        "CANCER (KARK)",
        "LEO (SIMHA)",
        "VIRGO (KANYA)",
        "LIBRA (TULA)",
        "SCORPIO (VRISHCHIK)",
        "SAGITTARIUS (DHANU)",
        "CAPRICORN (MAKAR)",
        "AQUARIUS (KUMBH)",
        "PISCES (MEEN)",
        "DON'T KNOW",
      ],
    },
    name_as_rashi: {
      type: String,
    },
    nakshatra: {
      type: String,
      enum: [
        "ASHVINI",
        "BHARANI",
        "KRITTIKA",
        "ROHINI",
        "MRIGASHIRSHA",
        "ARDRA",
        "PUNARVASU",
        "PUSHYA",
        "ASHLESHA",
        "MEGHA",
        "PURVA PHALGUNI",
        "UTTARA PHALGUNI",
        "HASTA",
        "CHITRA",
        "SWATI",
        "VISHAKHA",
        "ANURADHA",
        "JYESHTHA",
        "MULA",
        "PURVA ASHADHA",
        "UTTARA ASHADHA",
        "SHRAVANA",
        "DHANISHTA",
        "SHATABHISHAJ",
        "SHATATARAKA",
        "PURVA BHADRAPADA",
        "UTTARA BHADRAPADA",
        "REVATI",
        "ABHIJIT",
        "OTHER ",
        "DON'T KNOW",
      ],
    },
    gotra: {
      type: String,
    },
    is_manglik: {
      type: String,
      enum: ["Yes", "No"],
    },
  },
  documents_photos: {
    type: {
      profile_image: {
        type: String,
      },
      astro_profile: {
        type: String,
      },
      govt_document: {
        type: String,
      },
    },
  },
  religious_social_background: {
    type: {
      religion: {
        type: Schema.Types.ObjectId,
        ref: "religions",
        required: true,
      },
      caste: {
        type: Schema.Types.ObjectId,
        ref: "caste_lists",
        required: true,
      },
      caste_category: {
        type: String,
        enum: ["NT", "O.B.C.", "OPEN", "ST", "SC", "OTHER"],
      },
      mother_tongue: {
        type: Schema.Types.ObjectId,
        ref: "mother_tongues",
        required: true,
      },
      family_status: {
        type: String,
        enum: [
          "POOR",
          "MIDDLE CLASS",
          "UPPER MIDDLE CLASS",
          "RICH",
          "AFFLUENT",
        ],
      },
      family_type: {
        type: String,
        enum: ["JOINT", "NUCLEAR", "OTHER"],
      },
    },
  },
  family_details: {
    type: {
      father_name: {
        type: String,
      },
      father_occupation: {
        type: String,
        enum: [
          "Business",
          "Service-Private",
          "Service-Govt./PSU",
          "Army/Armed Forces",
          "Civil Services",
          "Retired",
          "Not Employed",
          "Expired",
          "Farmer",
        ],
      },
      mother_name: {
        type: String,
      },
      mother_occupation: {
        type: String,
        enum: [
          "Business",
          "Service-Private",
          "Service-Govt./PSU",
          "Army/Armed Forces",
          "Civil Services",
          "Retired",
          "Not Employed",
          "Expired",
          "Farmer",
          "Homemaker",
          "Housewife",
        ],
      },
      no_of_brothers: {
        type: String,
        enum: ["0", "1", "2", "3+"],
      },
      married_brothers: {
        type: String,
        enum: ["0", "1", "2", "3+"],
      },
      no_of_sisters: {
        type: String,
        enum: ["0", "1", "2", "3+"],
      },
      married_sisters: {
        type: String,
        enum: ["0", "1", "2", "3+"],
      },
    },
  },
  resedence_details: {
    type: {
      current_residence: {
        type: String,
      },
      full_address: {
        type: String,
      },
      pin_code: {
        type: String,
      },
      country: {
        type: String,
      },
      state: {
        type: String,
      },
      district: {
        type: String,
      },
      city: {
        type: String,
      },
      residence_status: {
        type: String,
        enum: [
          "COMPANY OWNED",
          "FAMILY OWNED",
          "LIVING WITH PARENTS",
          "NRI",
          "RENTED",
          "RESIDENT",
          "OWN HOUSE",
        ],
      },
    },
  },
  partner_preference: {
    type: {
      height: {
        type: {
          from: {
            type: Number,
          },
          to: {
            type: Number,
          },
        },
      },
      weight: {
        type: {
          from: {
            type: Number,
          },
          to: {
            type: Number,
          },
        },
      },
      age: {
        type: {
          from: {
            type: Number,
          },
          to: {
            type: Number,
          },
        },
      },
      qualification: {
        type: String,
      },
      salary_expectation: {
        type: String,
      },
      maritial_status: {
        type: String,
        enum: [
          "WIDOW",
          "MARRIED",
          "UNMARRIED",
          "DIVORCEE",
          "WIDOWER",
          "AWAITING DIVORCE",
          "SEPARATED",
        ],
        default: "UNMARRIED",
      },
      have_children: {
        type: String,
        enum: ["No", "Yes, living together", "Yes, living separately"],
        default: "No",
      },
      body_type: {
        type: String,
        enum: ["SLIM", "AVERAGE", "HEAVY", "ATHLETIC"],
      },
      complexion: {
        type: String,
        enum: [
          "FAIR",
          "VERY FAIR",
          "DARK",
          "WHEATISH",
          "WHEATISH MEDIUM",
          "WHEATISH BROWN",
        ],
      },
      intercast: {
        type: String,
        enum: ["Yes", "No"],
      },
      is_manglik: {
        type: String,
        enum: ["Yes", "No"],
      },
      partner_expectaion_details: {
        type: String,
      },
    },
  },
  password: {
    type: String,
  },
  verified_reset_otp: {
    type: Boolean,
  },
  otp: {
    type: String,
  },
  gallery_images: {
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
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  user.created_at = user.updated_at = new Date().toISOString();
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.pre("update", function (next) {
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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model("users", userSchema);
module.exports = User;
