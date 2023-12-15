const router = require('express').Router();

router.get("/", (req, res) => {
    res.status(200).json({msg:"you are welcome1!"});
});

/**
 * @swagger
 * /api/welcome:
 *   get:
 *     summary: Retorna todos os usuários.
 *     description: Obtém todos os usuários cadastrados.
 *     responses:
 *       '200':
 *         description: Sucesso ao obter os usuários.
 */
router.get("/api/welcome", (req, res) => {
    res.status(200).json({msg:"you are welcome2!"});
});

module.exports = router;