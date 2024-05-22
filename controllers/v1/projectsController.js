const router = require('express').Router();
const Projects = require('../../repositories/projectsRepository');
const ErrorLogModel = require('../../models/errorLogModel');
const db = require('../../db');
const httpP = require('../../models/httpResponsePatternModel');

/**
 * @swagger
 * /projects/get-all:
 *   get:
 *     summary: Solution projects.
 *     description: Get all solution projects.
 *     tags:
 *       - Projects
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number for pagination (default 1).
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: Success.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       projectId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       '400':
 *         description: Bad request, verify your request data.
 *       '404':
 *         description: Page not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/get-all', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket();        
    const { page } = req.query;
    const currentPage = parseInt(page) || httpP.DEFAULT_PAGE;

    try {
        const offset = (currentPage - 1) * httpP.PAGE_SIZE;

        const result = await Projects.data.findAndCountAll({
            limit: httpP.PAGE_SIZE,
            offset: offset,
            attributes: {                
                exclude: ['updatedAt']
            }
        });

        const totalPages = Math.ceil(result.count / httpP.PAGE_SIZE);

        response.setPagging(currentPage, totalPages);

        if (currentPage > totalPages && totalPages !== 0) {
            response.set(404, false);
            return await response.sendResponse();
        }

        response.set(200, true, null, result.rows);
        return await response.sendResponse();
    } catch (err) {
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err,currentTicket);

        await db.errorLogInsert(errorModel);
      
        response.set(500, false, [err.message]);
        return await response.sendResponse();
    }
});

module.exports = router;