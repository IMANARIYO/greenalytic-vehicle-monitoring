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
const vehiclesDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'vehiclesDocs.yaml'), 'utf8')
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
    { name: 'Users', description: 'User-related operations' },
    { name: 'Vehicles', description: 'Vehicle operations' },
    { name: 'TrackingDevices', description: 'Vehicle tracking endpoints' }
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
      VehicleCreateRequest: {
        "type": "object",
        "required": ["plateNumber", "usage", "userId", "vehicleModel", "vehicleType", "yearOfManufacture"],
        "properties": {
          "plateNumber": { "type": "string", "example": "RAA123B" },
          "registrationNumber": { "type": "string", "example": "REG-456" },
          "chassisNumber": { "type": "string", "example": "CH1234567890" },
          "vehicleType": { "type": "string", "example": "SUV" },
          "vehicleModel": { "type": "string", "example": "Toyota Prado" },
          "yearOfManufacture": { "type": "number", "example": 2020 },
          "usage": { "type": "string", "example": "Commercial" },
          "fuelType": { "type": "string", "enum": ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"], "example": "DIESEL" },
          "lastMaintenanceDate": { "type": "string", "format": "date-time", "example": "2024-05-12T00:00:00Z" },
          "userId": { "type": "number", "example": 1 }
        }
      },  VehicleUpdateRequest: {
        "type": "object",
        "properties": {
          "registrationNumber": { "type": "string", "example": "REG-456" },
          "chassisNumber": { "type": "string", "example": "CH1234567890" },
          "vehicleType": { "type": "string", "example": "SUV" },
          "vehicleModel": { "type": "string", "example": "Toyota Land Cruiser" },
          "usage": { "type": "string", "example": "Private" },
          "fuelType": { "type": "string", "enum": ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"], "example": "PETROL" },
          "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE", "MAINTENANCE"], "example": "ACTIVE" },
          "emissionStatus": { "type": "string", "enum": ["GOOD", "WARNING", "CRITICAL"], "example": "GOOD" },
          "lastMaintenanceDate": { "type": "string", "format": "date-time", "example": "2024-07-01T00:00:00Z" },
          "userId": { "type": "number", "example": 1 }
        }
      }
    
      ,
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
    ...vehiclesDocs,
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


export default swaggerSpec;
