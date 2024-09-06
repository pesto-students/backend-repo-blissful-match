const express = require('express');
const router = express.Router();
const authUtil = require('../utils/authUtil.js');
const CommonController = require('../controllers/commonController.js')

router.get('/add-bulk-data', CommonController.add);
router.get('/get-religions', CommonController.regionList);
router.get('/get-caste', CommonController.casteList);
router.get('/get-mother-tongue', CommonController.motherTongueList);
router.get('/get-occupation-list', CommonController.occupationList);
router.get('/get-contact-details', CommonController.adminDetails);
router.post('/submit-contactus-form', CommonController.submitContactusDetails);
router.post('/upload-files', authUtil.ensureAuthenticated, CommonController.uploadFiles);
router.post("/*", authUtil.ensureAuthenticated, function (req, res, next) {
    res
        .status(403)
        .json({message: "forbidden"});
});

module.exports = router;