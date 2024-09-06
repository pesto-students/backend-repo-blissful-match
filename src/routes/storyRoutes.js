const express = require('express');
const router = express.Router();
const authUtil = require('../utils/authUtil.js');
const StoryController = require('../controllers/storyController.js')

router.post('/upsert-story', authUtil.ensureAuthenticated, StoryController.upsertStory);
router.get('/get-mystory', authUtil.ensureAuthenticated, StoryController.getMyStory);
router.get('/get-top10-story', StoryController.getPublishedStory);
router.delete('/delete-mystory', authUtil.ensureAuthenticated, StoryController.deleteMyStory);
router.post("/*", authUtil.ensureAuthenticated, function (req, res, next) {
    res
        .status(403)
        .json({message: "forbidden"});
});

module.exports = router;