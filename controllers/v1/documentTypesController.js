const router = require('express').Router();
const util = require('../../services/utilService');
const DocumentTypes = require('../../repositories/documentTypesRepository');
const { v4: uuidv4 } = require('uuid');
const ErrorLogModel = require('../../models/errorLogModel');
const db = require('../../db');

/**
 * @swagger
 * /documenttypes/get-all:
 *   get:
 *     summary: User document types.
 *     description: Get all user document types.
 *     tags:
 *       - Document Types
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
 *       '404':
 *         description: Page not found.
 */
router.get('/get-all', util.checkToken, async (req, res) => {            
    const { page } = req.query;
    const currentPage = parseInt(page) || util.DEFAULT_PAGE;

    try {
        const offset = (currentPage - 1) * util.PAGE_SIZE;

        const result = await DocumentTypes.findAndCountAll({
            limit: util.PAGE_SIZE,
            offset: offset
        });

        const totalPages = Math.ceil(result.count / util.PAGE_SIZE);

        if (currentPage > totalPages && totalPages !== 0) {
            return await util.sendResponse(res, false, 404, 'Page not found', null, 'Page not found');
        }

        return await util.sendResponse(res, true, 200, 'Success', {
            data: result.rows,
            currentPage: currentPage,
            totalPages: totalPages
        });
    } catch (err) {
        let ticket = uuidv4();
        let errorLog = new ErrorLogModel(
            '/documenttype/get-all',
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