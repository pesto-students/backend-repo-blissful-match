const express = require('express');
const router = express.Router();
const authUtil = require('../utils/authUtil.js');
const UserController = require('../controllers/userController.js')

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/members', authUtil.optionallyAuthenticated, UserController.members);
router.post('/add-shortlist', authUtil.ensureAuthenticated, UserController.shortListUser);
router.post('/remove-shortlist', authUtil.ensureAuthenticated, UserController.removeShortListedUser);
router.get('/get-shortlist-users', authUtil.ensureAuthenticated, UserController.getShortListedUser);
router.post('/forgot-password', UserController.sendResetPasswordOTP);
router.post('/resend-otp', UserController.sendResetPasswordOTP);
router.post('/verify-otp', UserController.verifyRestPasswordOTP);
router.post('/update-password', UserController.updatePassword);
router.post('/viewed-contact', authUtil.ensureAuthenticated, UserController.viewedContact);
router.post('/update-profile', authUtil.ensureAuthenticated, UserController.updateProfile);
router.post('/update-profile-image', authUtil.ensureAuthenticated, UserController.updateProfileImage);
router.post('/change-password', authUtil.ensureAuthenticated, UserController.changePassword);
router.get('/get-my-profile', authUtil.ensureAuthenticated, UserController.getMyProfile);
router.get('/get-member-profile', authUtil.ensureAuthenticated, UserController.getMembersProfile);
router.get('/my-viewed-history', authUtil.ensureAuthenticated, UserController.getViewedHistory);
router.post("/*", authUtil.ensureAuthenticated, function (req, res, next) {
    res
        .status(403)
        .json({message: "forbidden"});
});

module.exports = router;