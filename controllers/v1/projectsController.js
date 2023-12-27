const router = require('express').Router();
const util = require('../../services/utilService');
const Projects = require('../../repositories/projectsRepository');
const { v4: uuidv4 } = require('uuid');
const ErrorLogModel = require('../../models/errorLogModel');
const db = require('../../db');

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
 */
router.get('/get-all', async (req, res) => {
    const { page } = req.query;
    const currentPage = parseInt(page) || util.DEFAULT_PAGE;

    try {
        const offset = (currentPage - 1) * util.PAGE_SIZE;

        const result = await Projects.findAndCountAll({
            limit: util.PAGE_SIZE,
            offset: offset,
            attributes: {                
                exclude: ['updatedAt']
            }
        });

        const totalPages = Math.ceil(result.count / util.PAGE_SIZE);

        if (currentPage > totalPages && totalPages !== 0) {
            return await util.sendResponse(res, false, 404, 'Page not found', null, 'Page not found');
        }

        return await util.sendResponse(res, true, 200, 'Success', result.rows, null, currentPage, totalPages);
    } catch (err) {
        let ticket = uuidv4();
        let errorLog = new ErrorLogModel(
            '/projects/get-all',
            0,
            3,
            err.message + err.stack,
            null,
            null,
            null,
            ticket
          );    
      
        await db.errorLogInsert(errorLog);
      
        return await util.sendResponse(res,false, 500, 'Try again later, your ticket is ' + ticket, null, [err.message]);
    }
});

module.exports = router;