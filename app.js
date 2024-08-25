require('dotenv').config();
const fs = require('fs');
const net = require('net');

// Bomdev Runtime Secret Management
function loadEnvFromPipe(pipeName){
    return new Promise((resolve, reject) => {
        fs.open(pipeName, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK, (err, fd) => {
            if (err) {
              console.error('Error to read pipe.');
              return reject(`Error to read pipe.`);              
            }
          
            const pipe = new net.Socket({ fd });
          
            // Listener para os dados recebidos
            pipe.on('data', (data) => {
              try {
                // Converte os bytes para string
                const jsonString = data.toString('utf-8');      
          
                // Converte a string para JSON
                const envConfigSecurity = JSON.parse(jsonString);      
          
                 // Sobrescrever as variáveis de ambiente em process.env
                 for (const key in envConfigSecurity) {
                    process.env[key] = envConfigSecurity[key];
                }

                console.log('Bomdev Runtime Secret Management is active.');



                resolve(process.env);
              } catch (error) {
                console.error('Error to load pipe data', error.message);
                reject(`Error to load pipe data: ${e.message}`);
              }
            });
          
            // Listener para o fim da transmissão de dados
            pipe.on('end', () => {    
              pipe.destroy();              
            });
          });
                  
    });
}

const pipeName = process.env.BOMDEV_RUNTIME_MANAGEMENT_SECRET;

loadEnvFromPipe(pipeName).then(() => {
    const express = require('express');
    const authController = require('./controllers/v1/authController');
    const oAuthController = require('./controllers/v1/oAuthController');
    const documentTypesController = require('./controllers/v1/documentTypesController');
    const projectsController = require('./controllers/v1/projectsController');
    const swaggerUi = require('swagger-ui-express');
    const swaggerJSDoc = require('swagger-jsdoc');
    const db = require('./db');
    const RolesModel = require('./models/rolesModel');
    const path = require('path');
    const cors = require('cors');
    const encript = require('./services/passwordEncryptService');
    const rateLimit = require('express-rate-limit');
    const AESEncrypt = require('./services/AESEncryptService');
    const {Op} = require('sequelize');

    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Bomdev API',
                version: '1.0.0',
                description: '',
            },
            host: 'localhost:3000',
            consumes: [
                'application/json'
            ],
            produces: [
                'application/json'
            ],
            servers:[
                {
                    url:'http://localhost:3000/api/v1',
                    description:'API Production'
                }
            ],
            tags:[
                {
                    'name': 'Auth',
                    'description': 'Authentication'
                },
                {
                    'name': 'OAuth',
                    'description': 'Log in using the Bomdev provider.'
                },
                {
                    'name': 'Document Types',
                    'description': 'User Document Types'
                },
                {
                    'name': 'Projects',
                    'description': 'Solution projects'
                }
            ],        
            components: {
                securitySchemes: {
                    JWT: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'Authorization',
                        description: 'Enter JWT token in the format "Bearer {token}"'
                    }                
                }
            }
        },
        apis: [
            './controllers/v1/*.js',
            './controllers/v2/*.js'
        ], // Controllers paths
        
    };  
    const swaggerSpec = swaggerJSDoc(swaggerOptions); 
    const options = {
        customCss: '.swagger-ui .info .title { background: url(../public/assets/img/logo.png) no-repeat left; background-size: contain; height: 60px; text-align:center; }',
        customSiteTitle: "Bomdev API Documentation"
    }; 
    
    const app = express();
    
    // tentativa 1 resolve samesite 
    //app.set('trust proxy', 1);
    
    // tentativa 2
    // const corsOptions = {
    //     origin: 'http://localhost:3000', // Substitua pelo domínio de sua aplicação
    //     credentials: true, // Permite cookies entre domínios
    //   };
    
    app.use(cors({
        origin: 'http://localhost:4200', // Substitua pelo domínio correto
        methods: 'GET, POST, PUT, DELETE', // Métodos permitidos
        credentials: true // Se necessário, para permitir cookies e autenticação
    }));
    
    // Define the rate limit
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 10, // Limit each IP 
        message: "Too many requests from this IP, please try again later."
      });
      
    // Apply the rate limiter to all requests
    app.use(limiter);
    
    
    app.use(express.json());
    app.listen(3000);
    
    
    // Serve static files from the "public" directory
    app.use('/public', express.static(path.join(__dirname, 'public')));
    
    // Mapping
    
    // v1
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, options));
    app.use('/api/v1/auth', authController);
    app.use('/api/v1/oauth', oAuthController);
    app.use('/api/v1/document-types', documentTypesController);
    app.use('/api/v1/projects', projectsController);
    
    // Database
    (async () => {
    
        const currentTicket = 'Default';
        
        // Sequelize
        const HttpRequestsLogs = require('./repositories/httpRequestsLogs');
        const Projects = require('./repositories/projectsRepository');
        const DocumentTypes = require('./repositories/documentTypesRepository');
        const Users = require('./repositories/authRepository');    
        const Roles = require('./repositories/rolesRepository');
        const UsersRoles = require('./repositories/usersRolesRepository');
        const UsersOAuth = require('./repositories/oAuthRepository');        
    
        await db._sequealize.sync();            
    
        await HttpRequestsLogs.data.findCreateFind({
            where: {
                ticket: currentTicket
            },
            defaults:{
                ticket: currentTicket,
                requestEndDate: new Date(),
                requestPath: 'System',
                requestIp: null,
                ownerUserId: null,
                requestCompletionStatus: 0,
                requestMethod: 'SYS'
            }
        });    
    
        await Projects.data.findCreateFind({
            where: {
                name: 'Default'
            },
            defaults:{
                name: 'Default',
                description: 'Default'
            }
        });
        await Projects.data.findCreateFind({
            where: {
                name: 'REP'
            },
            defaults:{
                name: 'REP',
                description: 'Revenues, Expensives and Provisions'
            }
        });
    
        await DocumentTypes.data.findCreateFind({
            where: {
                name: 'CPF'
            },
            defaults:{
                name: 'CPF',
                description: 'Cadastro de Pessoas Física'
            }
        });
        await DocumentTypes.data.findCreateFind({
            where: {
                name: 'CNPJ'
            },
            defaults:{
                name: 'CNPJ',
                description: 'Cadastro Nacional de Pessoas Jurídicas'
            }
        });
    
        await Roles.data.findCreateFind({
            where: {
                name: RolesModel.ROLE_ADMINISTRATOR
            },
            defaults:{
                name: RolesModel.ROLE_ADMINISTRATOR,
                description: RolesModel.ROLE_ADMINISTRATOR
            }
        });
        await Roles.data.findCreateFind({
            where: {
                name: RolesModel.ROLE_APPLICATION
            },
            defaults:{
                name: RolesModel.ROLE_APPLICATION,
                description: RolesModel.ROLE_APPLICATION
            }
        });
        await Roles.data.findCreateFind({
            where: {
                name: RolesModel.ROLE_USER
            },
            defaults:{
                name: RolesModel.ROLE_USER,
                description: RolesModel.ROLE_USER
            }
        });
    
        const defaultProjectId = 1;
        const oAuthUserEmail = 'oauth@bomdev.com.br';
        const oAuthUserPasswd = 'IlHEYonEwYAnTUmNiCaInECoMPTIng';
        const UserProcs = new Users.Procs(currentTicket);
    
        const oAuthUserAlreadyExists = await UserProcs.checkUserExists(oAuthUserEmail, defaultProjectId);
        const oAuthPasswdEncrypt = await encript.encryptPassword(oAuthUserPasswd);
        
        if(!oAuthUserAlreadyExists){
            const userId = await Users.createUser({
                firstName: 'OAuth',
                lastName: 'Bomdev',
                email: oAuthUserEmail,
                password: null,
                document: '08585787945',
                documentTypeId: 1,
                projectId: defaultProjectId,
                defaultLanguage: 'pt-br',
                picture: null
            }, RolesModel.ROLE_ADMINISTRATOR, currentTicket);
            // Reset password and confirmEmail automaticaly for current user
            await Users.resetPassword(userId, oAuthPasswdEncrypt, 'Default', true);      
            await UsersOAuth.createUserCallback(userId, 'https://rep.bomdev.com.br/oauth', currentTicket);    
    
            if(userId && userId > 0){
                console.log('Initial administrators were created')            
            }
        }

         // Update all AESEncrypt empty column
         const emptyUsersIdsAES = await Projects.data.findAll({
            where:{
                [Op.or]:[
                    {
                        encryptionAESKey: null
                    },
                    {
                        encryptionAESKey:''
                    },
                    {
                        encryptionAESIV: null
                    },
                    {
                        encryptionAESIV:''
                    }
                ]
            },
            attributes: ['projectId']
        });
                
        for (const project of emptyUsersIdsAES) {
            const _projectId = project.projectId;
            const { key, iv } = AESEncrypt.generateAESKeyAndIV();

            await Projects.data.update(
                {
                    encryptionAESKey: key,
                    encryptionAESIV: iv
                },
                {
                    where: {
                        projectId: _projectId
                    }
                }
            );
        }

        const encrypt = new AESEncrypt('d0bda0f10eb503b8f8aad5b741230b01b46bbc246858de40a6e0f516515c9d58', '9f2d3b52e6913abf76d1a81595ea7050');
        const encryptedData = encrypt.encrypt('teste guilherme');
        console.log('encrypted', encryptedData);
        const descryptedData = encrypt.decrypt(encryptedData);
        console.log('descrypted', descryptedData);
        // end encrypt
    
        // tests
        await db.executeProcedure('USP_TEST')
        .then(res => {
    
            console.log(res[0][0][0].result);
            
            // var records = res[0];
    
            // for(var x = 0; x < res.length; x++){
            //     console.log(records[0][x].result);
            // }
        })
        .catch(ex => {
            console.log('exception: ' + ex)
        });
        await db.executeProcedure('USP_TEST2',['test'])
        .then(res => {
    
            console.log(res[0][0][0].result);
            console.log(res[0][1][0].result);
            // var records = res[0];
    
            // for(var x = 0; x < res.length; x++){
            //     console.log(records[0][x].result);
            // }
        })
        .catch(ex => {
            console.log('exception: ' + ex)
        });
       
    })();    
});