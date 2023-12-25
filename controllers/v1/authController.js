const router = require('express').Router();
const _ = require('lodash');
const Auth = require('../../repositories/authRepository');
const util = require('../../services/utilService');

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
 *         description: Request was successful.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 */
router.post('/register', async (req, res) => {        
    var { firstName, lastName, document, email, password, projectId } = req.body;        
    let errors = [];

    if (Object.keys(req.body).length === 0) {
        return await util.sendResponse(res, false, 400, 'Bad request, verify your request data.');
    }

    if(_.isNull(firstName) || _.isEmpty(firstName)){
        errors.push('First Name is required.');
    }
    else if(firstName.length > Auth.MAX_FIRSTNAME_LENGTH){
        errors.push('First Name exceeds the maximum allowed length.');        
    }

    if(errors && errors.length > 0){
        return await util.sendResponse(res, false, 422, 'Unprocessable entity, the provided data is not valid', null, errors);
    }    

    return await util.sendResponse(res,true, 200, 'Request was successful.');
});

module.exports = router;