const router = require('express').Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register an user.
 *     description: Register a Bomdev user.
 *     tags:
 *       - Auth
 *     responses:
 *       '200':
 *         description: Success.
 *       '400':
 *         description: Bad request, verify your request data.
 */
router.post('/register', async (req, res) => {
    var { firstName, lastName, document, email, password, projectId } = req.body;
    
    if(!firstName){
        
    }

    await res.status(200).json({ msg: "you are welcome2!" });
});

module.exports = router;