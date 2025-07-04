import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON schema
let schemaText = fs.readFileSync(path.join(__dirname, '../../prisma/json-schema/json-schema.json'), 'utf8');
schemaText = schemaText.replace(/#\/definitions\//g, '#/components/schemas/');
const schema = JSON.parse(schemaText);

// Tell TS this is a record of paths
const userDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'usersDocs.yaml'), 'utf8')
) as Record<string, any>;

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Greenalytic Vehicle Monitoring API',
    version: '1.0.0',
    description: 'API documentation for Greenalytic system',
    contact: {
      name: 'Imanariyo Baptiste',
      email: 'imanariyobaptiste@gmail.com',
      url: 'https://imanariyo-portfolio-web.vercel.app/',
    },
  },
  servers: [
    { url: 'http://localhost:3000/api', description: 'Local Dev Server' },
    { url: 'https://greenalytic-vehicle-monitoring-api.onrender.com/api', description: 'Production' },
  ],
  tags: [
    { name: 'User', description: 'User-related operations' },
    { name: 'Vehicle', description: 'Vehicle operations' },
    { name: 'Tracking', description: 'Vehicle tracking endpoints' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ...schema.definitions,
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          username: { type: 'string', nullable: true, example: 'imanariyo baptiste' },
          email: { type: 'string', format: 'email', example: 'imanariyobaptiste@gmail.com' },
          image: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'
          },
          password: { type: 'string', example: 'password123' },
          nationalId: { type: 'string', nullable: true, example: '123456789' },
          gender: { type: 'string', nullable: true, example: 'Male' },
          phoneNumber: { type: 'string', nullable: true, example: '+250788123456' },
          location: { type: 'string', nullable: true, example: 'Kigali, Rwanda' },
          companyName: { type: 'string', nullable: true, example: 'Greenalytic Inc.' },
          companyRegistrationNumber: { type: 'string', nullable: true, example: 'REG123456' },
          businessSector: { type: 'string', nullable: true, example: 'Transportation' },
          fleetSize: { type: 'integer', nullable: true, example: 10 },
          language: { type: 'string', example: 'English' },
          notificationPreference: { type: 'string', example: 'Email' }



        }
      }
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    ...userDocs,
    '/__show-models': {
      get: {
        summary: 'Force schema display',
        tags: ['Development'],
        responses: {
          200: {
            description: 'Model test response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      }
    }
  },
};

// console.log(JSON.stringify(userDocs, null, 2));
export default swaggerSpec;
