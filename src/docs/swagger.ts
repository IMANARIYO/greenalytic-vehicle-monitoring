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
const emissionDataDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'emissionDataDocs.yaml'), 'utf8')
) as Record<string, any>;
const gpsDataDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'gpsDataDocs.yaml'), 'utf8')
) as Record<string, any>;
const fuelDataDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'fuelDataDocs.yaml'), 'utf8')
) as Record<string, any>;
const obdDataDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'obdDataDocs.yaml'), 'utf8')
) as Record<string, any>;
const trackingDevicesDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'trackingDevicesDocs.yaml'), 'utf8')
) as Record<string, any>;

const valueDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'valueDocs.yaml'), 'utf8')
) as Record<string, any>;
const technologyDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'TechnologyDocs.yaml'), 'utf8')
) as Record<string, any>;
const partnershipReasonDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'PartnershipReasonDocs.yaml'), 'utf8')
) as Record<string, any>;
const teamDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'TeamDocs.yaml'), 'utf8')
) as Record<string, any>;
const advisoryBoardDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'AdvisoryBoardDocs.yaml'), 'utf8')
) as Record<string, any>;
const ContactMessageDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'contactMessageDocs.yaml'), 'utf8')
) as Record<string, any>;
const PartnerCategoryDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'partnerCategoryDocs.yaml'), 'utf8')
) as Record<string, any>;
const PartnerDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'partnerDocs.yaml'), 'utf8')
) as Record<string, any>;
const FeatureDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'featureDocs.yaml'), 'utf8')
) as Record<string, any>;
const ProductDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'productDocs.yaml'), 'utf8')
) as Record<string, any>;
const SolutionDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'solutionDocs.yaml'), 'utf8')
) as Record<string, any>;
const TestimonialDocs = yaml.load(
  fs.readFileSync(path.join(__dirname, 'testimonialDocs.yaml'), 'utf8')
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
    { url: 'http://localhost:4000/api', description: 'Local Dev Server' },
    { url: 'https://greenalytic-vehicle-monitoring-1.onrender.com/api', description: 'Production' },
  ],
  tags: [
    { name: 'Users', description: 'User-related operations' },
    { name: 'Vehicles', description: 'Vehicle operations' },
    { name: 'TrackingDevices', description: 'Vehicle tracking endpoints' },
    { name: 'Emissions', description: 'Emission data endpoints' },
    { name: 'GPS Data', description: 'GPS data endpoints' },
    { name: 'Fuel Data', description: 'Fuel data endpoints' },
    { name: 'OBD Data', description: 'OBD data endpoints' },
    { name: 'Website/Values', description: 'Website value operations' },
    { name: 'Website/Technologies', description: 'Website technology operations' },
    { name: 'Website/Partnership Reasons', description: 'Website partnership reason operations' },
    { name: 'Website/Team', description: 'Website team member operations' },
    { name: 'Website/Advisory Board', description: 'Website advisory board member operations' },
    { name: 'Website/Contact Messages', description: 'Website contact message operations' },
    { name: 'Website/Partner Categories', description: 'Website partner category operations' },
    { name: 'Website/Partners', description: 'Website partner operations' },
    { name: 'Website/Features', description: 'Website feature operations' },
    { name: 'Website/Products', description: 'Website product operations' },
    { name: 'Website/Solutions', description: 'Website solution operations' },
    { name: 'Website/Testimonials', description: 'Website testimonial operations' },

   
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
      // Vehicle Request Schemas
      VehicleCreateRequest: {
        type: "object",
        required: ["plateNumber", "usage", "userId", "vehicleModel", "vehicleType", "yearOfManufacture"],
        properties: {
          plateNumber: { type: "string", example: "RAA123B" },
          registrationNumber: { type: "string", example: "REG-456" },
          chassisNumber: { type: "string", example: "CH1234567890" },
          vehicleType: { type: "string", example: "SUV" },
          vehicleModel: { type: "string", example: "Toyota Prado" },
          yearOfManufacture: { type: "number", example: 2020 },
          usage: { type: "string", example: "Commercial" },
          fuelType: { type: "string", enum: ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"], example: "DIESEL" },
          lastMaintenanceDate: { type: "string", format: "date-time", example: "2024-05-12T00:00:00Z" },
          userId: { type: "number", example: 1 }
        }
      },
      VehicleUpdateRequest: {
        type: "object",
        properties: {
          registrationNumber: { type: "string", example: "REG-456" },
          chassisNumber: { type: "string", example: "CH1234567890" },
          vehicleType: { type: "string", example: "SUV" },
          vehicleModel: { type: "string", example: "Toyota Land Cruiser" },
          usage: { type: "string", example: "Private" },
          fuelType: { type: "string", enum: ["PETROL", "DIESEL", "ELECTRIC", "HYBRID"], example: "PETROL" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"], example: "ACTIVE" },
          emissionStatus: { type: "string", enum: ["GOOD", "WARNING", "CRITICAL"], example: "GOOD" },
          lastMaintenanceDate: { type: "string", format: "date-time", example: "2024-07-01T00:00:00Z" },
          userId: { type: "number", example: 1 }
        }
      },
      
      // Vehicle Response Schemas
      VehicleListItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          plateNumber: { type: 'string', example: 'RAA123A' },
          vehicleType: { type: 'string', example: 'CAR' },
          vehicleModel: { type: 'string', example: 'Toyota RAV4' },
          status: { type: 'string', example: 'ACTIVE' },
          emissionStatus: { type: 'string', example: 'MEDIUM' },
          user: { $ref: '#/components/schemas/UserBasicInfo' }
        }
      },
      VehicleFullDetails: {
        allOf: [
          { $ref: '#/components/schemas/VehicleListItem' },
          {
            type: 'object',
            properties: {
              registrationNumber: { type: 'string', example: 'REG456789' },
              chassisNumber: { type: 'string', example: 'CHS987654321' },
              yearOfManufacture: { type: 'integer', example: 2020 },
              fuelType: { type: 'string', example: 'PETROL' },
              createdAt: { type: 'string', format: 'date-time', example: '2023-01-15T12:00:00Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2023-01-20T08:30:00Z' },
              trackingDevices: {
                type: 'array',
                items: { $ref: '#/components/schemas/TrackingDeviceInfo' }
              },
              emissionData: {
                type: 'array',
                items: { $ref: '#/components/schemas/EmissionData' }
              },
              maintenanceRecords: {
                type: 'array',
                items: { $ref: '#/components/schemas/MaintenanceRecord' }
              }
            }
          }
        ]
      },
      VehicleEmissionItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          plateNumber: { type: 'string', example: 'RAA123A' },
          vehicleType: { type: 'string', example: 'TRUCK' },
          emissionStatus: { type: 'string', example: 'HIGH' },
          lastEmissionReading: { type: 'number', format: 'float', example: 245.67 },
          lastReadingDate: { type: 'string', format: 'date-time', example: '2023-01-20T08:30:00Z' }
        }
      },
      PaginatedVehicleResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/VehicleListItem' }
          },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      },
      
      // Supporting Schemas
      UserBasicInfo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'john_doe' },
          email: { type: 'string', example: 'john@example.com' },
          role: { type: 'string', example: 'FLEET_MANAGER' },
          status: { type: 'string', example: 'ACTIVE' }
        }
      },
      TrackingDeviceInfo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          serialNumber: { type: 'string', example: 'TD-123456' },
          status: { type: 'string', example: 'ACTIVE' }
        }
      },
      EmissionData: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          value: { type: 'number', format: 'float', example: 210.5 },
          timestamp: { type: 'string', format: 'date-time', example: '2023-01-20T08:30:00Z' }
        }
      },
      MaintenanceRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          serviceType: { type: 'string', example: 'OIL_CHANGE' },
          datePerformed: { type: 'string', format: 'date-time', example: '2023-01-10T00:00:00Z' }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalItems: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 10 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
          nextPage: { type: 'integer', nullable: true, example: 2 },
          prevPage: { type: 'integer', nullable: true, example: null },
          sortBy: { type: 'string', example: 'createdAt' },
          sortOrder: { type: 'string', example: 'desc' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' }
        }
      },
      CountResponse: {
        type: 'object',
        properties: {
          count: { type: 'integer', example: 42 }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Error message' },
          timestamp: { type: 'string', format: 'date-time', example: '2023-01-20T08:30:00Z' },
          error: { type: 'string', nullable: true, example: 'Detailed error description' },
          details: { type: 'object', nullable: true, additionalProperties: true }
        }
      },
      DeviceCreateRequest: {
        type: "object",
        required: ["serialNumber", "status", "type"],
        properties: {
          serialNumber: { type: "string", example: "TD-123456" },
          status: { 
            type: "string", 
            enum: ["ACTIVE", "INACTIVE", "MAINTENANCE", "DECOMMISSIONED"],
            example: "ACTIVE"
          },
          type: { 
            type: "string", 
            enum: ["GPS", "OBD", "TELEMATICS"],
            example: "GPS"
          },
          manufacturer: { type: "string", example: "Greenalytic Inc." },
          model: { type: "string", example: "GT-2000" },
          firmwareVersion: { type: "string", example: "2.3.1" },
          installationDate: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" },
          lastCalibrationDate: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" }
        }
      },
      DeviceUpdateRequest: {
        type: "object",
        properties: {
          status: { 
            type: "string", 
            enum: ["ACTIVE", "INACTIVE", "MAINTENANCE", "DECOMMISSIONED"],
            example: "ACTIVE"
          },
          type: { 
            type: "string", 
            enum: ["GPS", "OBD", "TELEMATICS"],
            example: "GPS"
          },
          manufacturer: { type: "string", example: "Greenalytic Inc." },
          model: { type: "string", example: "GT-2000" },
          firmwareVersion: { type: "string", example: "2.3.1" },
          installationDate: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" },
          lastCalibrationDate: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" }
        }
      },
      DeviceListItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          serialNumber: { type: "string", example: "TD-123456" },
          status: { 
            type: "string", 
            enum: ["ACTIVE", "INACTIVE", "MAINTENANCE", "DECOMMISSIONED"],
            example: "ACTIVE"
          },
          type: { 
            type: "string", 
            enum: ["GPS", "OBD", "TELEMATICS"],
            example: "GPS"
          },
          assignedVehicle: { 
            type: "object",
            nullable: true,
            properties: {
              id: { type: "integer", example: 1 },
              plateNumber: { type: "string", example: "RAA123A" }
            }
          },
          createdAt: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" }
        }
      },
      DeviceFullDetails: {
        allOf: [
          { $ref: '#/components/schemas/DeviceListItem' },
          {
            type: "object",
            properties: {
              manufacturer: { type: "string", example: "Greenalytic Inc." },
              model: { type: "string", example: "GT-2000" },
              firmwareVersion: { type: "string", example: "2.3.1" },
              installationDate: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" },
              lastCalibrationDate: { type: "string", format: "date-time", example: "2024-01-15T00:00:00Z" },
              updatedAt: { type: "string", format: "date-time", example: "2024-01-20T00:00:00Z" },
              locationHistory: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    latitude: { type: "number", format: "float", example: -1.9398 },
                    longitude: { type: "number", format: "float", example: 30.0645 },
                    timestamp: { type: "string", format: "date-time", example: "2024-01-20T08:30:00Z" }
                  }
                }
              },
              telemetryData: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    speed: { type: "number", format: "float", example: 60.5 },
                    batteryLevel: { type: "number", format: "float", example: 85.2 },
                    signalStrength: { type: "number", format: "float", example: 92.0 },
                    timestamp: { type: "string", format: "date-time", example: "2024-01-20T08:30:00Z" }
                  }
                }
              }
            }
          }
        ]
      },
      PaginatedDeviceResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/DeviceListItem" }
          },
          meta: { $ref: "#/components/schemas/PaginationMeta" }
        }
      },
      // User Schema
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
      },
      CreateEmissionDataRequest: {
      type: 'object',
      required: ['vehicleId', 'co2Percentage', 'coPercentage', 'o2Percentage', 'hcPPM', 'trackingDeviceId'],
      properties: {
        vehicleId: { type: 'integer', example: 1 },
        co2Percentage: { type: 'number', minimum: 0, maximum: 20, example: 0.8 },
        coPercentage: { type: 'number', minimum: 0, maximum: 10, example: 0.4 },
        o2Percentage: { type: 'number', minimum: 0, maximum: 25, example: 20.5 },
        hcPPM: { type: 'integer', minimum: 0, maximum: 10000, example: 150 },
        noxPPM: { type: 'number', minimum: 0, maximum: 5000, example: 80, nullable: true },
        pm25Level: { type: 'number', minimum: 0, maximum: 500, example: 30, nullable: true },
        trackingDeviceId: { type: 'integer', example: 1 },
        plateNumber: { type: 'string', example: 'ABC-123', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z', nullable: true }
      }
    },

    UpdateEmissionDataRequest: {
      type: 'object',
      properties: {
        co2Percentage: { type: 'number', minimum: 0, maximum: 20, example: 1.2 },
        coPercentage: { type: 'number', minimum: 0, maximum: 10, example: 0.6 },
        o2Percentage: { type: 'number', minimum: 0, maximum: 25, example: 19.8 },
        hcPPM: { type: 'integer', minimum: 0, maximum: 10000, example: 200 },
        noxPPM: { type: 'number', minimum: 0, maximum: 5000, example: 120, nullable: true },
        pm25Level: { type: 'number', minimum: 0, maximum: 500, example: 35, nullable: true },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T11:00:00Z', nullable: true },
        deletedAt: { type: 'string', format: 'date-time', nullable: true }
      }
    },
    CreateGpsDataRequest: {
      type: 'object',
      required: ['trackingDeviceId', 'latitude', 'longitude'],
      properties: {
        trackingDeviceId: { type: 'integer', example: 1 },
        vehicleId: { type: 'integer', example: 1, nullable: true },
        latitude: { type: 'number', format: 'float', example: -1.2921 },
        longitude: { type: 'number', format: 'float', example: 36.8219 },
        speed: { type: 'number', format: 'float', example: 60.5, nullable: true },
        altitude: { type: 'number', format: 'float', example: 1500, nullable: true },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    },
    UpdateGpsDataRequest: {
      type: 'object',
      properties: {
        latitude: { type: 'number', format: 'float', example: -1.2921 },
        longitude: { type: 'number', format: 'float', example: 36.8219 },
        speed: { type: 'number', format: 'float', example: 65.0, nullable: true },
        altitude: { type: 'number', format: 'float', example: 1550, nullable: true },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T11:00:00Z' },
        deletedAt: { type: 'string', format: 'date-time', nullable: true }
      }
    },
    CreateFuelDataRequest: {
      type: 'object',
      required: ['vehicleId', 'fuelType', 'quantity', 'cost'],
      properties: {
        trackingDeviceId: { type: 'integer', example: 1 },
        vehicleId: { type: 'integer', example: 1 },
        fuelType: { type: 'string', enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'], example: 'PETROL' },
        fuelLevel: { type: 'number', format: 'float', example: 75.5, nullable: true },
        fuelConsumption: { type: 'number', format: 'float', example: 15.0, nullable: true },
        quantity: { type: 'number', format: 'float', example: 50.0 },
        cost: { type: 'number', format: 'float', example: 100.0 },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    },
    UpdateFuelDataRequest: {
      type: 'object',
      properties: {
        fuelType: { type: 'string', enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'], example: 'DIESEL' },
        fuelLevel: { type: 'number', format: 'float', example: 80.0, nullable: true },
        fuelConsumption: { type: 'number', format: 'float', example: 12.5, nullable: true },
        quantity: { type: 'number', format: 'float', example: 60.0 },
        cost: { type: 'number', format: 'float', example: 120.0 },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2025-07-10T11:00:00Z' },
        deletedAt: { type: 'string', format: 'date-time', nullable: true }
      }
    },
    CreateOBDDataRequest: {
      type: 'object',
      required: ['vehicleId', 'trackingDeviceId', 'speed', 'rpm'],
      properties: {
        vehicleId: { type: 'integer', example: 1 },
        trackingDeviceId: { type: 'integer', example: 1 },
        rpm: { type: 'integer', example: 3000 },
        fuelLevel: { type: 'number', format: 'float', example: 75.5, nullable: true },
        coolantTemperature: { type: 'number', format: 'float', example: 90.0, nullable: true },
        throttlePosition: { type: 'number', format: 'float', example: 25.0, nullable: true },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    },
    UpdateOBDDataRequest: {
      type: 'object',
      properties: {
        rpm: { type: 'integer', example: 3200 },
        fuelLevel: { type: 'number', format: 'float', example: 80.0, nullable: true },
        coolantTemperature: { type: 'number', format: 'float', example: 95.0, nullable: true },
        throttlePosition: { type: 'number', format: 'float', example: 30.0, nullable: true },
        plateNumber: { type: 'string', example: 'XYZ-789', nullable: true },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T11:00:00Z' },
        deletedAt: { type: 'string', format: 'date-time', nullable: true }
      }
    }
    

    },
    parameters: {
      deviceId: {
        in: "path",
        name: "id",
        required: true,
        schema: {
          type: "integer"
        },
        description: "ID of the tracking device"
      },
      page: {
        in: 'query',
        name: 'page',
        schema: {
          type: 'integer',
          default: 1,
          minimum: 1
        },
        description: 'Page number for pagination'
      },
      limit: {
        in: 'query',
        name: 'limit',
        schema: {
          type: 'integer',
          default: 10,
          minimum: 1,
          maximum: 100
        },
        description: 'Number of items per page'
      },
      sortBy: {
        in: 'query',
        name: 'sortBy',
        schema: {
          type: 'string',
          enum: ['id', 'plateNumber', 'registrationNumber', 'chassisNumber', 'vehicleType', 'vehicleModel', 'yearOfManufacture', 'status', 'emissionStatus', 'createdAt', 'updatedAt'],
          default: 'createdAt'
        },
        description: 'Field to sort by'
      },
      sortOrder: {
        in: 'query',
        name: 'sortOrder',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc'
        },
        description: 'Sort direction'
      },
      vehicleId: {
        in: 'path',
        name: 'id',
        required: true,
        schema: {
          type: 'integer'
        },
        description: 'ID of the vehicle'
      }
    },
    responses: {
      BadRequest: {
        description: 'Bad request - invalid parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      Conflict: {
        description: 'Conflict - resource already exists',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error - invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    ...userDocs,
    ...vehiclesDocs,
    ...emissionDataDocs,
    ...trackingDevicesDocs,
    ...gpsDataDocs,
    ...fuelDataDocs,
    ...obdDataDocs,
    ...valueDocs,
    ...technologyDocs,
    ...partnershipReasonDocs,
    ...teamDocs,
    ...advisoryBoardDocs,
    ...ContactMessageDocs,
    ...PartnerCategoryDocs,
    ...PartnerDocs,
    ...FeatureDocs,
    ...ProductDocs,
    ...SolutionDocs,
    ...TestimonialDocs,
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
  }
};

export default swaggerSpec;