const router = require('express').Router();

router.get("/", (req, res) => {
    res.status(200).json({msg:"you are welcome1!"});
});

router.get("/api/welcome", (req, res) => {
    res.status(200).json({msg:"you are welcome2!"});
});

module.exports = router;