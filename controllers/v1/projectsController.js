const router = require('express').Router();

/**
 * @swagger
 * /projects/get-all:
 *   get:
 *     summary: Solution projects.
 *     description: Get all solution projects.
 *     tags:
 *       - Projects
 *     responses:
 *       '200':
 *         description: Success.
 */
router.get('/get-all', async (req, res) => {


    await res.status(200).json({ msg: "you are welcome2!" });
});

module.exports = router;