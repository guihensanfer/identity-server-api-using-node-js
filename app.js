require('dotenv').config();
require('./services/db');

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const indexController = require('./controllers/indexController');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
        title: 'Minha API',
        version: '1.0.0',
        description: 'Documentação da Minha API',
        },
    },
    apis: ['./controllers/*.js'], // Controllers paths
};  
const swaggerSpec = swaggerJSDoc(swaggerOptions);  

const app = express();
app.use(express.json());
app.listen(3000);
// Mapping
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/', indexController);

