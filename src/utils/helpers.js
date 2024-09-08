const config = require("../config/3-config.js");
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({region: config.REGION});
const moment = require('moment');

const isValidDate = async (date) => {
  return moment(date, moment.ISO_8601, true).isValid();
}

const isDateBeforeTodayOrGivenDate = async (date, givenDate) => {
  // Parse the input date
  const inputDate = moment(date);
  
  // Get today's date
  const today = givenDate || moment().startOf('day'); // Start of the day to exclude time

  // Check if the input date is before today
  return inputDate.isValid() && inputDate.isBefore(today);
}

const buildQueryFilter = async (filterVal) => {
  let finalQuery = [];
  for (let key in filterVal) {
    let query = {};
    if (filterVal[key]) {
      if (key === "age" || key === "height") {
        query[key] = {
          $gte: parseFloat(filterVal[key].min),
          $lte: parseFloat(filterVal[key].max),
        };
      } else if (key === "_id" || key === "religion"){
        query[key] = filterVal[key];
      }else {
        query[key] = { $regex: filterVal[key], $options: "i" };
      }
      console.log('query+---------------',JSON.stringify(query));
      finalQuery.push(query)
    }    
  }
  return finalQuery;
}

const sendEmail = async (mailOptions, callback) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
          user: config.SMTP_USERNAME,
          pass: config.SMTP_PASSWORD
      }
    });
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true  
  } catch (error) {
    console.log("mailOptions ", mailOptions)
    console.error('Error in email send:', error);
    return false  
  }
}

const validatePassword = async (password) => {
  // Define the password validation criteria
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
      return { valid: false, message: `Password must be at least ${minLength} characters long.` };
  }
  if (!hasUpperCase) {
      return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!hasLowerCase) {
      return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!hasDigit) {
      return { valid: false, message: 'Password must contain at least one digit.' };
  }
  if (!hasSpecialChar) {
      return { valid: false, message: 'Password must contain at least one special character.' };
  }

  return { valid: true, message: 'Password is valid.' };
}
const removeEmptyObjects = async (obj) => {
  // Filter out empty objects and arrays recursively
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key, value]) => {
        // Check if the value is an object and not an array
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively clean nested objects
          value = removeEmptyObjects(value);
          // Keep the key if the cleaned value is not an empty object
          return Object.keys(value).length > 0;
        }
        // Keep non-empty values and non-object types
        return value !== undefined && value !== '' && value !== null;
      })
  );
}
const uploadFileInS3 = async (s3Data) => {
  try {
    const data = await S3.putObject(s3Data).promise();
    console.log("AWS file upload", data)
    return true;  
  } catch (error) {
    console.log("error:: ", JSON.stringify(error));
    throw error
  }
}
const getFileFromS3 = async (params) => {
  try {
    const url = await S3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (err) {
    console.error('Error generating pre-signed URL', err);
    throw err;
  }
  
}
module.exports = {
  buildQueryFilter,
  sendEmail,
  validatePassword,
  isValidDate,
  isDateBeforeTodayOrGivenDate,
  uploadFileInS3,
  removeEmptyObjects,
  getFileFromS3
};