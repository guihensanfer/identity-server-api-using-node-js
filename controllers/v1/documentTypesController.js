const router = require('express').Router();

/**
 * @swagger
 * /documenttypes/get-all:
 *   get:
 *     summary: User document types.
 *     description: Get all user document types.
 *     tags:
 *       - Document Types
 *     responses:
 *       '200':
 *         description: Success.
 */
router.get('/get-all', async (req, res) => {
    var { firstName, lastName, document, email, password, projectId } = req.body;
    


    await res.status(200).json({ msg: "you are welcome2!" });
});

module.exports = router;