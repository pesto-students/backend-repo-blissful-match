module.exports = {
  MONGO_URI:
    process.env.MONGO_URI ||
    "mongodb+srv://blissfulmatch:vx2LooXyzln8gVQe@blissfulmatch.vmzig.mongodb.net/blissful_match?retryWrites=true&w=majority&appName=BlissfulMatch",
  /* "MONGO_URI": process.env.MONGO_URI || "mongodb://localhost:27017/blissful_match?retryWrites=true&w=majority", */
  JWT_SECRET: process.env.JWT_SECRET || "brandeasyAU0cwm2weEqyG3Y3C",
  JWT_EXPIRY_IN: parseInt(process.env.JWT_EXPIRY_IN) || 90 * 86400,
  RAZORPAY_ID: "rzp_test_anWHmZFzkBielD",
  RAZORPAY_SECRET_KEY: "lUXgQoD5F7XI1Vqn5MgsJ44Q",
  /* RAZORPAY_ID: "rzp_live_bDE3IDwNfuFpqx",
  RAZORPAY_SECRET_KEY: "kjSCKREan2fq7wJTXLYfp2gM", */
  "AWS_FILE_UPLOAD_LIMIT": process.env.AWS_FILE_UPLOAD_LIMIT || 11, //size in MB like: 10 MB
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "blissfulmatch.matrimonial@gmail.com",
  SMTP_ADMIN_EMAIL: process.env.SMTP_ADMIN_EMAIL || "blissfulmatch.matrimonial@gmail.com",
  SMTP_USERNAME: process.env.SMTP_USERNAME || "blissfulmatch.matrimonial@gmail.com",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "eixi ybed jkgo dang",
  port: 3001,
  REGION: process.env.REGION || "ap-south-1",
  S3_BUCKET: process.env.S3_BUCKET || "blissfulmatch-assets",
  SALT_ROUNDS: 10,
  refreshTokenSecret: process.env.refreshTokenSecret || "BrandhvYRVNkD1wlpIfks",
  refreshTokenLife: parseInt(process.env.refreshTokenLife) || 91 * 86400,
  stage: process.env.stage || "dev",
  signedUrlExpireSeconds: 60 * 5,
  url: "http://localhost:3001/",
  //"base_url" : "http://13.127.42.254:3001/",
  base_url: "http://localhost:3001/",
  main_host: "http://13.127.42.254/matrimonial/",
  /* "rootPath": process.env.rootPath || "http://localhost:3000", */
  apiEndpoint: process.env.apiEndpoint || "http://localhost:3000/"
};
