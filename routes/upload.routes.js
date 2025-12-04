const express = require('express');
const upload = require('../middleware/upload.middleware');
const auth = require('../middleware/auth.middleware');
const router = express.Router();

router.post('/', auth, upload.single("image"), (req, res) => {
    res.json({ message: "Image uploaded Successfully", imageUrl: req.file.path })
})

module.exports = router;