const router = require('express').Router();
const _ = require('lodash');
const Auth = require('../../repositories/authRepository');
const util = require('../../services/utilService');
const mail = require('../../services/mailService');
const DocumentTypesModel = require('../../models/documentTypesModel');
const RolesModel = require('../../models/rolesModel');
const Projects = require('../../repositories/projectsRepository');
const UsersRoles = require('../../repositories/usersRolesRepository');
const Roles = require('../../repositories/rolesRepository');
const bcrypt = require('bcrypt');
const db = require('../../db');
const ErrorLogModel = require('../../models/errorLogModel');
const jwt = require('jsonwebtoken');
const httpP = require('../../models/httpResponsePatternModel');
const url = require('url');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register an user.
 *     description: Register a Bomdev user.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 200
 *               password:
 *                 type: string
 *                 maxLength: 300
 *               document:
 *                 type: object
 *                 properties:
 *                   documentTypeId:
 *                     type: integer
 *                     description: ID of the document type
 *                   documentValue:
 *                     type: string
 *                     description: Value of the document
 *               defaultLanguage:
 *                 type: string
 *                 example: pt-br
 *                 maxLength: 50
 *               projectId:
 *                 type: integer
 *             required:
 *               - firstName
 *               - email
 *               - projectId
 *     responses:
 *       '201':
 *         description: User successfully created.
 *       '400':
 *         description: Bad request, verify your request data.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/register', async (req, res) => {      
    let response = new httpP.HTTPResponsePatternModel();  
    const currentTicket = response.getTicket(); 
    var { firstName, lastName, document, email, password, projectId, defaultLanguage } = req.body;        
    let errors = [];  
    const authProcs = new Auth.Procs(currentTicket);
    const rolesProcs = new Roles.Procs(currentTicket);

    try
    {
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse(res);
        }

        // First Name
        if(_.isNull(firstName) || _.isEmpty(firstName)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('First Name'));
        }
        else if(firstName.length > Auth.MAX_FIRSTNAME_LENGTH){            
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('First Name'));        
        }

        // Last Name
        if(_.isNull(lastName) || _.isEmpty(lastName)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Last Name'));
        }
        else if(lastName.length > Auth.MAX_LASTNAME_LENGTH){            
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('Last Name')); 
        }

        // Document
        if(document){
            let documentValid = DocumentTypesModel.isValid(document);
            if(documentValid.valid == false){
                errors.push(documentValid.msg);
            }
        }    

        // Email
        if(_.isNull(email) || _.isEmpty(email)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Email'));            
        }
        else if(email.length > Auth.MAX_EMAIL_LENGTH){
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('Email'));                     
        }
        else if(!util.isValidEmail(email)){            
            errors.push('Valid email is required.');
        }    

        // Password
        if(_.isNull(password) || _.isEmpty(password)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Password'));     
        }
        else if(password.length > Auth.MAX_PASSWORD_LENGTH){
            errors.push('Password exceeds the maximum allowed length.');        
        }  

        // ProjectId
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

        // defaultLanguage
        if(!_.isNull(defaultLanguage) && !_.isEmpty(defaultLanguage)){            
            if(defaultLanguage.length > Auth.MAX_LANGUAGE_LENGTH){
                errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('DefaultLanguage'));                        
            }
        }        

        // Check if user already exists
        let userExists = await authProcs.checkUserExists(email, projectId);
        if(userExists){
            errors.push(httpP.HTTPResponsePatternModel.alreadyExistsMsg('User'));                 
        }    

        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422,false, errors);

            return await response.sendResponse(res);
        }
    
    
        // Create password
        let salt = await bcrypt.genSaltSync(12);
        let passwordHash = await bcrypt.hashSync(password, salt);

        // Create user
        let user = await Auth.data.create({
            firstName: firstName.trim(),
            lastName: lastName?.trim(),
            email: email?.trim(),
            password: passwordHash,
            document: document.documentValue?.trim(),
            documentTypeId: document.documentTypeId,
            projectId: projectId,
            defaultLanguage: defaultLanguage?.trim()
        });

        // Create permission
        if(user){
            let userId = user.userId;
            let roleId = await rolesProcs.getRoleIdByName(RolesModel.ROLE_USER);

            let userRole = await UsersRoles.data.create({
                userId: userId,
                roleId: roleId
            });

            if(!userRole){
                throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('user role'));
            }
        }
        else
        {
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('user'));
        }

        response.set(201, true);
        return await response.sendResponse(res);
    }
    catch(err){
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);

        response.set(500, false, [err.message]);      
        return await response.sendResponse(res);
    }    
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in.
 *     description: Log in an user.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 200
 *               password:
 *                 type: string
 *                 maxLength: 300
 *               projectId:
 *                 type: integer
 *               continueWithRefreshToken:
 *                 type: string
 *                 description: Use this parameter to continue with a refresh token. 1 After the log in, a new refresh token is generated. 2. To obtain a new access token using refresh token, send only the refresh token without including any additional attributes.
 *                 example: string // TODO If you have this, then send only the refresh token without including any additional attributes
 *     responses:
 *       '200':
 *         description: Log in was successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   type: string
 *                   description: The ticket of the request
 *                 message:
 *                   type: string
 *                   description: Message indicating successful login
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the login was successful
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of errors (null in case of success)
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: User authentication token
 *                     expiredAccessAt:
 *                       type: string
 *                       format: date-time
 *                       description: Access token expiration date and time
 *                     refreshToken:
 *                       type: string
 *                       description: Use the refresh token for seamless future authentication. If you wish to utilize the refresh token for logging in, include only the refresh token in your request.
 *                     expiredRefreshAt:
 *                       type: string
 *                       format: date-time
 *                       description: Refresh token expiration date and time
 *       '400':
 *         description: Bad request, verify your request data.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '404':
 *         description: User not found.
 *       '401':
 *         description: Log in unauthorized.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/login', async (req, res) => {    
    let response = new httpP.HTTPResponsePatternModel();  
    let currentTicket = response.getTicket(); 
    var { 
        email, password, projectId, continueWithRefreshToken
    } = req.body;        
    let errors = [];
    const rolesProcs = new Roles.Procs(currentTicket);
    const authProcs = new Auth.Procs(currentTicket);
    let byPassword = true;

    try
    {  
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse(res);
        }
        
        if(_.isNull(continueWithRefreshToken) || _.isEmpty(continueWithRefreshToken)){
             // Email
            if(_.isNull(email) || _.isEmpty(email)){
                errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Email'));            
            }
            else if(email.length > Auth.MAX_EMAIL_LENGTH){
                errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('Email'));               
            }
            else if(!util.isValidEmail(email)){
                errors.push('Valid email is required.');
            }    

            // Password
            if(_.isNull(password) || _.isEmpty(password)){
                errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Password'));
            }
            else if(password.length > Auth.MAX_PASSWORD_LENGTH){
                errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('Password'));
            }  

            // ProjectId
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
        }
        else
        {
            if(email || password || projectId){
                response.set(400, false, null, null, "Send only the refresh token without including any additional attributes.");
                return await response.sendResponse(res);
            }

            const userID = await authProcs.userTokenVerify(continueWithRefreshToken, req.ip);

            if(!userID || userID <= 0){
                response.set(401, false);
                return await response.sendResponse(res);
            }

            const user = await Auth.data.findOne({
                where: {
                    userId: userID
                }
            });

            if(!user){
                response.set(401, false);
                return await response.sendResponse(res);
            }            

            email = user.email;
            projectId = user.projectId;
            byPassword = false;
        }                

        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422, false, errors);
            return await response.sendResponse(res);
        }
    
        // Check user
        let user = await Auth.data.findOne({
            where: {
                email: email,
                projectId: projectId
            }
        });

        if(!user){
            response.set(404, false);
            return await response.sendResponse(res);
        }
        else if(byPassword) {
            let checkPassword = await bcrypt.compare(password, user.password);
            if(!checkPassword){
                response.set(401, false);
                return await response.sendResponse(res);
            }            
        }

        let userRoles = await UsersRoles.data.findAll({
            where: {
                userId: user.userId
            }
        });

        let roleIds = userRoles.map(x => x.roleId);

        if(!userRoles || userRoles.length <= 0){
            throw new Error(httpP.HTTPResponsePatternModel.cannotGetMsg('User role'));
        }

        let roleNames = await rolesProcs.getRoleArrayNamesByIds(roleIds);

        let secret = process.env.SECRET;        
        let token = jwt.sign({            
            id: user.userId,
            userEmail: user.email,
            userName: user.firstName,
            roles: [roleNames]
        },
        secret,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRATION + 'm'
        });        

        const accessExpiresAt = new Date();
        const refreshExpiresAt = new Date();

        accessExpiresAt.setMinutes(accessExpiresAt.getMinutes() + parseInt(process.env.JWT_ACCESS_EXPIRATION));        
        refreshExpiresAt.setMinutes(refreshExpiresAt.getMinutes() + parseInt(process.env.JWT_REFRESH_EXPIRATION));

        const refresh = await authProcs.userTokenCreate(user.userId, refreshExpiresAt, req.ip, 'REFRESH_TOKEN');

        const result = {
            accessToken: token,
            accessExpiredAt: accessExpiresAt,
            refreshToken: refresh,
            refreshExpiredAt: refreshExpiresAt
        };

        response.set(200, true, null, result);
        return await response.sendResponse(res);
    }
    catch(err){                 
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);
      
        response.set(500, false, [err.message]);
        return await response.sendResponse(res);
    } 
});

/**
 * @swagger
 * /auth/forgetpassword:
 *   post:
 *     summary: Callback url for reset
 *     description: Generate and send secure email with password reset callback URL
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 200
 *               clientUrl:
 *                 type: string
 *                 example: https://example.com.br
 *               projectId:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Log in was successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   type: string
 *                   description: The ticket of the request
 *                 message:
 *                   type: string
 *                   description: Message indicating successful login
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the login was successful
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of errors (null in case of success)
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: User token to reset password
 *                     email:
 *                       type: string
 *                       description: User email
 *                     callbackUrl:
 *                       type: string
 *                       description: The result callback url
 *       '400':
 *         description: Bad request, verify your request data.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '404':
 *         description: User not found.
 *       '401':
 *         description: Log in unauthorized.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/forgetpassword', httpP.HTTPResponsePatternModel.auth([RolesModel.ROLE_ADMINISTRATOR, RolesModel.ROLE_APPLICATION]), async (req, res) => {    
    let response = new httpP.HTTPResponsePatternModel();  
    let currentTicket = response.getTicket(); 
    var { 
        email, projectId, clientUrl
    } = req.body;        
    let errors = [];    
    const authProcs = new Auth.Procs(currentTicket);    

    try
    {  
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse(res);
        }
        
         // Email
         if(_.isNull(email) || _.isEmpty(email)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Email'));            
        }
        else if(email.length > Auth.MAX_EMAIL_LENGTH){
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('Email'));               
        }
        else if(!util.isValidEmail(email)){
            errors.push('Valid email is required.');
        }          

        // ProjectId
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

        // clientUrl
        if(_.isNull(clientUrl) || _.isEmpty(clientUrl)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('clientUrl'));            
        }
        else if(!util.isValidURI(clientUrl))
        {
            errors.push('clientUrl is invalid.');
        }

        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422, false, errors);
            return await response.sendResponse(res);
        }
    
        // Check user
        let user = await Auth.data.findOne({
            where: {
                email: email,
                projectId: projectId
            }
        });

        if(!user){
            response.set(404, false);
            return await response.sendResponse(res);
        }        

        // Create token

        const accessExpiresAt = new Date();        

        accessExpiresAt.setMinutes(accessExpiresAt.getMinutes() + parseInt(process.env.JWT_ACCESS_EXPIRATION));        
        const token = await authProcs.userTokenCreate(user.userId, accessExpiresAt, req.ip, 'FORGET_PASSWORD');
        
        if(!token){
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('token'));
        }
        const queryParams = {
            token: token,
            email: email
        };

        const callbackUrl = url.format({
            pathname: clientUrl,
            query: queryParams
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,            
            subject: 'Forget password - Application ' + projectId + ', Bomdev',
            html: 'You forgot your password of application the ' + projectId + '.</br><a href="' + callbackUrl + '">Click here</a> to change the password.</br></br>Bomdev Software House'
        };

        const result = {
            token: token,
            email: email,
            callbackUrl: callbackUrl
        };

        mail.sendEmail(mailOptions, projectId);

        response.set(200, true, null, result);
        return await response.sendResponse(res);
    }
    catch(err){                 
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);
      
        response.set(500, false, [err.message]);
        return await response.sendResponse(res);
    } 
});

/**
 * @swagger
 * /auth/resetpassword:
 *   post:
 *     summary: Change user password.
 *     description: Using token in the /forgetpassword end point, set a new user password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 200
 *               clientUrl:
 *                 type: string
 *                 example: https://example.com.br
 *               projectId:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Log in was successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   type: string
 *                   description: The ticket of the request
 *                 message:
 *                   type: string
 *                   description: Message indicating successful login
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the login was successful
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of errors (null in case of success)
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: User token to reset password
 *                     email:
 *                       type: string
 *                       description: User email
 *                     callbackUrl:
 *                       type: string
 *                       description: The result callback url
 *       '400':
 *         description: Bad request, verify your request data.
 *       '422':
 *         description: Unprocessable entity, the provided data is not valid.
 *       '404':
 *         description: User not found.
 *       '401':
 *         description: Log in unauthorized.
 *       '500':
 *         description: Internal Server Error.
 */
router.post('/resetpassword', httpP.HTTPResponsePatternModel.auth([RolesModel.ROLE_ADMINISTRATOR, RolesModel.ROLE_APPLICATION]), async (req, res) => {    
    let response = new httpP.HTTPResponsePatternModel();  
    let currentTicket = response.getTicket(); 
    var { 
        email, projectId, clientUrl
    } = req.body;        
    let errors = [];    
    const authProcs = new Auth.Procs(currentTicket);    

    try
    {  
        if (Object.keys(req.body).length === 0) {
            response.set(400,false);

            return await response.sendResponse(res);
        }
        
         // Email
         if(_.isNull(email) || _.isEmpty(email)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('Email'));            
        }
        else if(email.length > Auth.MAX_EMAIL_LENGTH){
            errors.push(httpP.HTTPResponsePatternModel.lengthExceedsMsg('Email'));               
        }
        else if(!util.isValidEmail(email)){
            errors.push('Valid email is required.');
        }          

        // ProjectId
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

        // clientUrl
        if(_.isNull(clientUrl) || _.isEmpty(clientUrl)){
            errors.push(httpP.HTTPResponsePatternModel.requiredMsg('clientUrl'));            
        }
        else if(!util.isValidURI(clientUrl))
        {
            errors.push('clientUrl is invalid.');
        }

        // ----- Check for errors
        if(errors && errors.length > 0){
            response.set(422, false, errors);
            return await response.sendResponse(res);
        }
    
        // Check user
        let user = await Auth.data.findOne({
            where: {
                email: email,
                projectId: projectId
            }
        });

        if(!user){
            response.set(404, false);
            return await response.sendResponse(res);
        }        

        // Create token

        const accessExpiresAt = new Date();        

        accessExpiresAt.setMinutes(accessExpiresAt.getMinutes() + parseInt(process.env.JWT_ACCESS_EXPIRATION));        
        const token = await authProcs.userTokenCreate(user.userId, accessExpiresAt, req.ip, 'FORGET_PASSWORD');
        
        if(!token){
            throw new Error(httpP.HTTPResponsePatternModel.cannotBeCreatedMsg('token'));
        }
        const queryParams = {
            token: token,
            email: email
        };

        const callbackUrl = url.format({
            pathname: clientUrl,
            query: queryParams
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,            
            subject: 'Forget password - Application ' + projectId + ', Bomdev',
            html: 'You forgot your password of application the ' + projectId + '.</br><a href="' + callbackUrl + '">Click here</a> to change the password.</br></br>Bomdev Software House'
        };

        const result = {
            token: token,
            email: email,
            callbackUrl: callbackUrl
        };

        mail.sendEmail(mailOptions, projectId);

        response.set(200, true, null, result);
        return await response.sendResponse(res);
    }
    catch(err){                 
        let errorModel = ErrorLogModel.DefaultForEndPoints(req, err, currentTicket);

        await db.errorLogInsert(errorModel);
      
        response.set(500, false, [err.message]);
        return await response.sendResponse(res);
    } 
});


module.exports = router;