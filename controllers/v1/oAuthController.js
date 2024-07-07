const router = require('express').Router();
const _ = require('lodash');
const oAuth = require('../../repositories/oAuthRepository');
const Auth = require('../../repositories/authRepository');
const RolesModel = require('../../models/rolesModel');
const Projects = require('../../repositories/projectsRepository');
const UsersRoles = require('../../repositories/usersRolesRepository');
const db = require('../../db');
const ErrorLogModel = require('../../models/errorLogModel');
const httpP = require('../../models/httpResponsePatternModel');
const { request } = require('express');

/**
 * @swagger
 * /oauth/user-check-email-exists:
 *   post:
 *     summary: Check if email already exists.
 *     description: Check if email already exists.
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 maxLength: 200
 *               enabled:
 *                 type: boolean
 *                 example: true
 *               projectId:
 *                 type: int
 *             required:
 *               - email
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: Email already exists.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized.
 *       '404':
 *         description: Email not exists.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/user-check-email-exists', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {         
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket(); 
    var { email, enabled, projectId } = req.body;        
    let errors = [];  

    try
    {
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse();
        }

        // client callback
        if(_.isNull(email) || _.isEmpty(email)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('email'));
        }
        else if(callbackUri.length > Auth.MAX_EMAIL_LENGTH){            
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('email'));        
        }
        else if(!util.isValidEmail(email)){            
            errors.push('Valid email is required.');
        }    
        
        // ProjectId
        projectId = httpP.HTTPResponsePatternModel.verifyProjectIdOrDefault(req, projectId);

        if(!projectId){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('ProjectId'));                 
        }
        else{
            let project = await Projects.data.findOne({
                where: {
                    projectId: projectId
                }
            });

            if(!project){
                errors.push('ProjectId is invalid.');
            }            
        }
        
        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422,false, errors);

            return await response.sendResponse();
        }        
         
        const authProcs = new Auth.Procs(currentTicket);

        const result = await authProcs.checkUserExists(email, projectId, enabled);

        if(!result){
            response.set(404, true, null, false);
            return await response.sendResponse();    
        }

        response.set(200, true, null, true);
        return await response.sendResponse();
    }
    catch(err){
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);

        response.set(500, false, [err.message]);      
        return await response.sendResponse();
    }    
});

/**
 * @swagger
 * /oauth/set-context:
 *   post:
 *     summary: Set a callback context for current application user group.
 *     description: Used to complete the login using the Bomdev application provider.
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               callbackUri:
 *                 type: string
 *                 maxLength: 300
 *                 example: https://exemple.com/auth.aspx
 *             required:
 *               - callbackUri
 *     security:
 *       - JWT: []
 *     responses:
 *       '201':
 *         description: Set context was successful. A new secret code has been generete.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/set-context', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {         
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket(); 
    var { callbackUri } = req.body;        
    let errors = [];  

    try
    {
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse();
        }

        // client callback
        if(_.isNull(callbackUri) || _.isEmpty(callbackUri)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('callbackUri'));
        }
        else if(callbackUri.length > oAuth.MAX_CALLBACKURI_LENGTH){            
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('callbackUri'));        
        }
        
        // ProjectId
        projectId = httpP.HTTPResponsePatternModel.verifyProjectIdOrDefault(req, null);

        if(!projectId){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('ProjectId'));                 
        }
        else{
            let project = await Projects.data.findOne({
                where: {
                    projectId: projectId
                }
            });

            if(!project){
                errors.push('ProjectId is invalid.');
            }            
        }

        const userId = req.user.id;
        
        if(!userId || userId <= 0){
            errors.push(httpP.HTTPResponsePatternModel.cannotGetMsg('User from Request'));
        }            


        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422,false, errors);

            return await response.sendResponse();
        }        
         
        await oAuth.createUserCallback(userId, callbackUri, currentTicket);

        response.set(201, true, null, null, 'Set context was successful. A new secret code has been generete.');
        return await response.sendResponse();
    }
    catch(err){
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);

        response.set(500, false, [err.message]);      
        return await response.sendResponse();
    }    
});

/**
 * @swagger
 * /oauth/get-context:
 *   get:
 *     summary: Get callback context profile / your secret key.
 *     description: Get your callback profile and see the secret key.
 *     tags:
 *       - OAuth
 *     parameters:
 *       - name: secretKey
 *         in: query
 *         description: (Optional) secret key of the callback context.
 *         required: false
 *         type: string
 *         maxLength: 100
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: Context get was successful.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized. 
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/get-context', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {         
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket();     
    let errors = [];  
    let secretKey = req.query.secretKey;

    try
    {                
        // ProjectId
        projectId = httpP.HTTPResponsePatternModel.verifyProjectIdOrDefault(req, null);

        if(!projectId){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('ProjectId'));                 
        }
        else{
            let project = await Projects.data.findOne({
                where: {
                    projectId: projectId
                }
            });

            if(!project){
                errors.push('ProjectId is invalid.');
            }            
        }

        let requestBySecretKey = false;
        if(!_.isNull(secretKey) && !_.isEmpty(secretKey) && !_.isUndefined(secretKey)){
            requestBySecretKey = true;
        }
        

        const userId = req.user.id;
        
        if(!userId || userId <= 0){
            errors.push(httpP.HTTPResponsePatternModel.cannotGetMsg('User from Request'));
        }            


        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422,false, errors);

            return await response.sendResponse();
        }        
         
        const oAuthProcs = new oAuth.Procs(currentTicket);

        const data = await oAuthProcs.getCallbackContext(
            !requestBySecretKey ? userId : null,
            !requestBySecretKey ? projectId : null, 
            requestBySecretKey ? secretKey : null
        );

        response.set(200, true, null, data, 'Get data was successful.');
        return await response.sendResponse();
    }
    catch(err){
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);

        response.set(500, false, [err.message]);      
        return await response.sendResponse();
    }    
});

/**
 * @swagger
 * /oauth/user-assign-application-role:
 *   post:
 *     summary: Assign "APPLICATION_ROLE" privilegies to a user (only for super users privilegies).
 *     description: Assigns the "APPLICATION_ROLE" to a specified user, enabling them to use OAuth and other related endpoints.
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: int
 *             required:
 *               - userId
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: Operation was successful.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized. 
 *       '404':
 *         description: User not found.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/user-assign-application-role', httpP.HTTPResponsePatternModel.authWithSuperUserGroup(), async (req, res) => {         
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket();     
    var { userId } = req.body;       
    let errors = [];  

    try
    {
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse();
        }        
        
        // ProjectId
        projectId = httpP.HTTPResponsePatternModel.verifyProjectIdOrDefault(req, null);

        if(!projectId){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('projectId'));                 
        }
        else{
            let project = await Projects.data.findOne({
                where: {
                    projectId: projectId
                }
            });

            if(!project){
                errors.push('ProjectId is invalid.');
            }            
        }        
        
        if(!userId || userId <= 0){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('userId'));
        }            


        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422,false, errors);

            return await response.sendResponse();
        }        

        // Check user
        let user = await Auth.data.findOne({
            where: {
                userId: userId,
                projectId: projectId
            }
        });

        if(!user){
            response.set(404, false);
            return await response.sendResponse();
        }       
         
        await UsersRoles.setUserNewRole(userId, RolesModel.ROLE_APPLICATION, currentTicket);

        response.set(200, true, null, data, 'Operation was successful.');
        return await response.sendResponse();
    }
    catch(err){
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);

        response.set(500, false, [err.message]);      
        return await response.sendResponse();
    }    
});

/**
 * @swagger
 * /oauth/user-info:
 *   get:
 *     summary: Get user profile.
 *     description: Get user profile.
 *     tags:
 *       - OAuth
 *     parameters:
 *       - name: code
 *         in: query
 *         description: The callback code received with context for get user profile.
 *         required: true
 *         type: string
 *         maxLength: 100
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: Operation was successful.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized. 
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/user-info', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {         
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket();     
    let errors = [];  
    // From auth jwt
    const code = req.query.code;

    try
    {   
        
        // ProjectId
        projectId = httpP.HTTPResponsePatternModel.verifyProjectIdOrDefault(req, null);

        if(!projectId){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('ProjectId'));                 
        }
        else{
            let project = await Projects.data.findOne({
                where: {
                    projectId: projectId
                }
            });

            if(!project){
                errors.push('ProjectId is invalid.');
            }            
        }

        if(_.isNull(code) || _.isEmpty(code)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('code'));        
        }
        
        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422,false, errors);

            return await response.sendResponse();
        }        

        const authProcs = new Auth.Procs(currentTicket);

        const dataFromCode = await authProcs.userTokenVerifyAll(code);

        if(_.isNull(dataFromCode) || _.isEmpty(dataFromCode)){
            response.set(401, false);
            return await response.sendResponse();
        }
        
        const userId = parseInt(dataFromCode.data);
        
        if(!userId || userId <= 0){
            errors.push(httpP.HTTPResponsePatternModel.cannotGetMsg('User from Request'));
        }            
         
        const data = await Auth.data.findOne({
            where:{
                userId:userId,
                projectId:projectId // secury to get the same users projectId from the user request
            },
            attributes:['userId', 'firstName', 'lastName', 'email', 'defaultLanguage', 'picture', 'projectId', 'emailConfirmed', 'enabled']                                    
        });

        response.set(200, true, null, data, 'Get data was successful.');
        return await response.sendResponse();
    }
    catch(err){
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);

        response.set(500, false, [err.message]);      
        return await response.sendResponse();
    }    
});


module.exports = router;