// src/docs/swaggerSpec.ts
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// let schemaText = fs.readFileSync(path.join(__dirname, '../../prisma/json-schema/json-schema.json'), 'utf8');
let schemaText = fs.readFileSync(path.join(__dirname, '../../prisma/json-schema/json-schema.json'), 'utf8');
schemaText = schemaText.replace(/#\/definitions\//g, '#/components/schemas/');
const schema = JSON.parse(schemaText);

// Load your modular YAMLs
const userDocsRaw = yaml.load(fs.readFileSync(path.join(__dirname, 'usersDocs.yaml'), 'utf8'));
const userDocs = typeof userDocsRaw === 'object' && !Array.isArray(userDocsRaw) ? userDocsRaw : {};
// const vehicleDocs = yaml.load(fs.readFileSync(path.join(__dirname, 'vehicles.yaml'), 'utf8'));
// add others as needed

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
    { url: 'http://localhost:5000/api', description: 'Local Dev Server' },
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
      // Optionally extend manually defined schemas here too
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

    // etc.
  },
};

export default swaggerSpec;
