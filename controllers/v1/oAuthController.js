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
const util = require('../../services/utilService');

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
 *               projectId:
 *                 type: integer
 *                 nullable: true
 *                 description: (Optional) projectId
 *               enabled:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - email
 *               - projectId
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: User already exists.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized.
 *       '404':
 *         description: User not exists.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/user-check-email-exists', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {         
    let response = await new httpP.HTTPResponsePatternModel(req,res).useLogs();     
    const currentTicket = response.getTicket(); 
    var { email, projectId, enabled } = req.body;        
    let errors = [];  

    try
    {
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse();
        }

        // email
        if(_.isNull(email) || _.isEmpty(email)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('email'));
        }
        else if(email.length > Auth.MAX_EMAIL_LENGTH){            
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('email'));        
        }
        else if(!util.isValidEmail(email)){            
            errors.push('Valid email is required.');
        }    


        // Security to prevent an user role different than SU can requests another projectsIds
        if(!projectId || req.user.projectId !== 1){
            // ProjectId
            projectId = httpP.HTTPResponsePatternModel.verifyProjectIdOrDefault(req, projectId);
        }                
        

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
            response.set(404, true, null, {
                userExists: false
            }, 
            'User not found');
            return await response.sendResponse();    
        }

        response.set(200, true, null, {
            userExists: true
        }, 
        'User found');
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
 *   put:
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
router.put('/set-context', httpP.HTTPResponsePatternModel.authWithAdminGroup(), async (req, res) => {         
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get data was successful.
 *                 ticket:
 *                   type: string
 *                   example: c721af44-0183-4643-b7a7-f6ea9232842c
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 errors:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     clientCallbackUri:
 *                       type: string
 *                       example: http://example.com.br/login/callback
 *                     clientSecret:
 *                       type: string
 *                       example: 79c7fa3f-bf20-4bd2-a748-0edecc431ede
 *                     firstName:
 *                       type: string
 *                       example: User Name
 *                     lastName:
 *                       type: string
 *                       example: Last Name
 *                     defaultLanguage:
 *                       type: string
 *                       example: pt-br
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-07-17T17:05:05.000Z
 *                     callbackStatus:
 *                       type: integer
 *                       example: 1
 *                     projectId:
 *                       type: integer
 *                       example: 1
 *                     projectName:
 *                       type: string
 *                       example: Project Name
 *                     projectDescription:
 *                       type: string
 *                       example: Project description
 *                     projectPicture:
 *                       type: string
 *                       nullable: true
 *                       example: http://example.com.br/assets/img/picture.png
 *       '400':
 *         description: Bad request, verify your request data.
 *       '401':
 *         description: Log in unauthorized. 
 *       '404':
 *         description: Context not found. 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Context not found.
 *                 ticket:
 *                   type: string
 *                   example: c721af44-0183-4643-b7a7-f6ea9232842c
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 errors:
 *                   type: object
 *                   example: null
 *                 data:
 *                   type: object
 *                   example: null
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

        if(!data){
            response.set(404, true, null, data, 'Context not found.');
            return await response.sendResponse();
        }

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
 *   put:
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
router.put('/user-assign-application-role', httpP.HTTPResponsePatternModel.authWithSuperUserGroup(), async (req, res) => {         
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
 *         description: The returns of the /auth/login endpoint.
 *         required: true
 *         type: string
 *         maxLength: 100
 *     security:
 *       - JWT: []
 *     responses:
 *       '200':
 *         description: Operation was successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get data was successful.
 *                 ticket:
 *                   type: string
 *                   example: 423dd3d4-da04-405b-a382-3e310da088a1
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 errors:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     firstName:
 *                       type: string
 *                       example: User first name
 *                     lastName:
 *                       type: string
 *                       example: User last name
 *                     email:
 *                       type: string
 *                       format: email
 *                     defaultLanguage:
 *                       type: string
 *                       example: pt-br
 *                     picture:
 *                       type: string
 *                       format: uri
 *                       example: https://example.com.br/assets/img/example.png
 *                     projectId:
 *                       type: integer
 *                       example: 1
 *                     emailConfirmed:
 *                       type: boolean
 *                       example: true
 *                     enabled:
 *                       type: boolean
 *                       example: true
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

        if(!data){
            response.set(401, false);
            return await response.sendResponse();
        }

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