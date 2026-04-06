/**
 * Swagger / OpenAPI Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description:
        'A role-based finance dashboard backend with JWT authentication, ' +
        'RBAC, financial record management, and analytics.',
      contact: {
        name: 'Tejas',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registration & Login' },
      { name: 'Users', description: 'User management (Admin)' },
      { name: 'Financial Records', description: 'CRUD for financial entries' },
      { name: 'Dashboard', description: 'Summary & analytics endpoints' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
