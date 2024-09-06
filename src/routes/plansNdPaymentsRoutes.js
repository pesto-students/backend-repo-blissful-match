const express = require('express');
const router = express.Router();
const authUtil = require('../utils/authUtil.js');
const PlansController = require('../controllers/plansController.js')

router.get('/get-plans', PlansController.getPLans);
router.post('/generate-order', authUtil.ensureAuthenticated, PlansController.generateOrder);
router.post('/verify-signature', authUtil.ensureAuthenticated, PlansController.verifySignature);
router.post("/*", authUtil.ensureAuthenticated, function (req, res, next) {
    res
        .status(403)
        .json({message: "forbidden"});
});

module.exports = router;