import prisma from "../src/config/db.js";
import {
  UserRole,
  UserStatus,
  FuelType,
  VehicleStatus,
  EmissionStatus,
  NotificationType,
  DeviceCategory,
  CommunicationProtocol,
  DeviceStatus,
  ConnectionStatus,
  SolutionType,
  Department,
  Vehicle,
  Prisma
} from '@prisma/client';
import { passHashing } from '../src/utils/passwordfunctions.js';
import { faker } from '@faker-js/faker';


// Configuration
const TOTAL_USERS = 100;
const VEHICLES_PER_USER = 50;
const RECORDS_PER_DATA_TYPE = 40;
const ADDITIONAL_RECORDS = 20;

// Helper function to clean the database
async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  const modelNames = [
    'UserNotification', 'ActivityLog', 'Alert', 'EmissionData', 'FuelData', 
    'GpsData', 'OBDData', 'MaintenanceRecord', 'TrackingDevice', 'Vehicle', 
    'User', 'ConnectionState', 'DeviceHeartbeat', 'Report', 'ThresholdConfig',
    'InventoryItem', 'Solution', 'Testimonial', 'Value', 'Product', 'Feature',
    'Technology', 'Team', 'AdvisoryBoard', 'PartnerCategory', 'Partner',
    'PartnershipReason', 'BlogPost', 'ContactMessage'
  ];

  for (const model of modelNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${model}" CASCADE;`);
      console.log(`✅ Cleared ${model} table`);
    } catch (error) {
      console.error(`❌ Error clearing ${model} table:`, error);
    }
  }
}

// Seed Users
async function seedUsers() {
  console.log('🌱 Seeding Users...');
  const hashedPassword = await passHashing('password123');
  const users  = [
    {

      username: 'admin_user',
      email: 'admin@vehicletracking.com',
      password: hashedPassword,
      nationalId: 'ID123456789',
      gender: 'Male',
      phoneNumber: '+250788123456',
      location: 'Kigali, Rwanda',
      companyName: 'Vehicle Tracking Solutions',
      companyRegistrationNumber: 'RW-REG-001',
      businessSector: 'Technology',
      fleetSize: 50,
      language: 'English',
      notificationPreference: 'Email',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      verified: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {

      username: 'fleet_manager',
      email: 'fleetmanager@logistics.com',
      password: hashedPassword,
      nationalId: 'ID987654321',
      gender: 'Female',
      phoneNumber: '+250788654321',
      location: 'Kigali, Rwanda',
      companyName: 'Logistics Pro Rwanda',
      companyRegistrationNumber: 'RW-REG-002',
      businessSector: 'Transportation',
      fleetSize: 25,
      language: 'English',
      notificationPreference: 'SMS',
      role: UserRole.FLEET_MANAGER,
      status: UserStatus.ACTIVE,
      verified: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {

      username: 'tech_support',
      email: 'technician@maintenance.com',
      password: hashedPassword,
      nationalId: 'ID456789123',
      gender: 'Male',
      phoneNumber: '+250788987654',
      location: 'Kigali, Rwanda',
      companyName: 'Auto Maintenance Services',
      companyRegistrationNumber: 'RW-REG-003',
      businessSector: 'Automotive',
      fleetSize: 10,
      language: 'English',
      notificationPreference: 'Email',
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      verified: true,
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    }
  ]



  // Create regular users
  for (let i = 0; i < TOTAL_USERS; i++) {
    const gender = faker.person.sex();
    users.push({
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: hashedPassword,
      nationalId: faker.string.numeric(10),
      gender,
      phoneNumber: `+25078${faker.string.numeric(6)}`,
      location: faker.location.city(),
      companyName: faker.company.name(),
      companyRegistrationNumber: `RW-REG-${faker.string.numeric(6)}`,
      businessSector: faker.commerce.department(),
      fleetSize: faker.number.int({ min: 1, max: 100 }),
      language: 'English',
      notificationPreference: faker.helpers.arrayElement(['Email', 'SMS']),
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      verified: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')

    });
  }

  // Batch insert users
  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await prisma.user.createMany({ data: batch });
    console.log(`✅ Inserted ${Math.min(i + batchSize, users.length)} / ${users.length} users`);
  }

  console.log(`🎉 Finished seeding ${users.length} users.`);
}

// Seed Vehicles
async function seedVehicles() {
  console.log('🌱 Seeding Vehicles...');
  
  const users = await prisma.user.findMany({ select: { id: true } });
  const fuelTypes = Object.values(FuelType);
  const vehicleStatuses = Object.values(VehicleStatus);
  const emissionStatuses = Object.values(EmissionStatus);
  const vehicleModels = ["Toyota Hilux", "Isuzu FVR", "Nissan Hardbody", "Kia Frontier", "Land Cruiser"];
  const vehicleTypes = ["Truck", "Car", "Van", "Motorcycle", "SUV"];
  const usages = ["Delivery", "Transport", "Logistics", "Private", "Public"];

  let vehicleCount = 0;
  const totalVehicles = users.length * VEHICLES_PER_USER;

  for (const user of users) {
const vehicles: Prisma.VehicleCreateManyInput[] = [];
    
    for (let i = 0; i < VEHICLES_PER_USER; i++) {
      const plateSuffix = String(vehicleCount + 1).padStart(4, "0");
      const plateNumber = `R${String.fromCharCode(65 + ((vehicleCount) % 26))}D-${plateSuffix}`;

      vehicles.push({
        plateNumber,
        registrationNumber: `RW-VEH-${(vehicleCount + 1).toString().padStart(4, "0")}`,
        chassisNumber: `CHS-${faker.string.alphanumeric(8).toUpperCase()}`,
        vehicleType: vehicleTypes[vehicleCount % vehicleTypes.length],
        vehicleModel: vehicleModels[vehicleCount % vehicleModels.length],
        yearOfManufacture: 2010 + (vehicleCount % 15),
        usage: usages[vehicleCount % usages.length],
        fuelType: fuelTypes[vehicleCount % fuelTypes.length],
        status: vehicleStatuses[vehicleCount % vehicleStatuses.length],
        emissionStatus: emissionStatuses[vehicleCount % emissionStatuses.length],
        lastMaintenanceDate: faker.date.past({ years: 2 }),
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vehicleCount++;
    }

    // Insert vehicles for this user
    await prisma.vehicle.createMany({ data: vehicles });
    console.log(`✅ Inserted ${vehicleCount} / ${totalVehicles} vehicles`);
  }

  console.log(`🎉 Finished seeding ${vehicleCount} vehicles.`);
}

// Seed Tracking Devices
async function seedTrackingDevices() {
  console.log('🌱 Seeding Tracking Devices...');
  
  const vehicles = await prisma.vehicle.findMany({ 
    select: { id: true, plateNumber: true, userId: true } 
  });
  const deviceCategories = Object.values(DeviceCategory);
  const communicationProtocols = Object.values(CommunicationProtocol);
  const deviceStatuses = Object.values(DeviceStatus);

  let deviceCount = 0;
  const totalDevices = vehicles.length;

  for (const vehicle of vehicles) {
    const device = {
      serialNumber: `TRK-${faker.string.alphanumeric(8).toUpperCase()}`,
      model: faker.helpers.arrayElement(['GPS-Pro-X1', 'GPS-Lite-Y2', 'GPS-Mini-Z3']),
      type: faker.helpers.arrayElement(['Advanced Fleet Tracker', 'Standard Vehicle Tracker', 'Compact Tracker']),
      plateNumber: vehicle.plateNumber,
      batteryLevel: faker.number.float({ min: 20, max: 100, multipleOf: 0.1 }),
      signalStrength: faker.number.int({ min: 50, max: 100 }),
      deviceCategory: deviceCategories[deviceCount % deviceCategories.length],
      firmwareVersion: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`,
      simCardNumber: `25078${faker.string.numeric(6)}`,
      installationDate: faker.date.past({ years: 1 }),
      communicationProtocol: communicationProtocols[deviceCount % communicationProtocols.length],
      dataTransmissionInterval: faker.helpers.arrayElement(['30 seconds', '1 minute', '2 minutes', '5 minutes']),
      enableOBDMonitoring: faker.datatype.boolean(),
      enableGPSTracking: faker.datatype.boolean(),
      enableEmissionMonitoring: faker.datatype.boolean(),
      enableFuelMonitoring: faker.datatype.boolean(),
      isActive: faker.datatype.boolean(),
      status: deviceStatuses[deviceCount % deviceStatuses.length],
      lastPing: faker.date.recent(),
      userId: vehicle.userId,
      vehicleId: vehicle.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await prisma.trackingDevice.create({ data: device });
    deviceCount++;
    
    if (deviceCount % 100 === 0) {
      console.log(`✅ Inserted ${deviceCount} / ${totalDevices} tracking devices`);
    }
  }

  console.log(`🎉 Finished seeding ${deviceCount} tracking devices.`);
}

// Seed Data Records (GPS, Emission, Fuel, OBD)
async function seedDataRecords() {
  console.log('🌱 Seeding Data Records...');
  
const trackingDevices = await prisma.trackingDevice.findMany({
  where: { vehicleId: { not: null } }, 
  select: { id: true, vehicleId: true, plateNumber: true }
});

  let recordCount = 0;
  const totalRecords = trackingDevices.length * 4 * RECORDS_PER_DATA_TYPE;

  for (const device of trackingDevices) {
      if (!device.vehicleId) continue;
    // Seed GPS Data
    const gpsData = Array.from({ length: RECORDS_PER_DATA_TYPE }, () => ({
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      plateNumber: device.plateNumber,
      speed: faker.number.float({ min: 0, max: 120, multipleOf: 0.1 }),
      accuracy: faker.number.float({ min: 90, max: 100, multipleOf: 0.1 }),
      timestamp: faker.date.recent({ days: 30 }),
      vehicleId: device.vehicleId!,
      trackingStatus: faker.datatype.boolean(),
      trackingDeviceId: device.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await prisma.gpsData.createMany({ data: gpsData });
    recordCount += gpsData.length;
    console.log(`✅ Inserted ${recordCount} / ${totalRecords} records (GPS)`);

    // Seed Emission Data
    const emissionData = Array.from({ length: RECORDS_PER_DATA_TYPE }, () => ({
      timestamp: faker.date.recent({ days: 30 }),
      co2Percentage: faker.number.float({ min: 0.1, max: 5, multipleOf: 0.1 }),
      coPercentage: faker.number.float({ min: 0, max: 1, multipleOf: 0.1 }),
      o2Percentage: faker.number.float({ min: 15, max: 21, multipleOf: 0.1 }),
      hcPPM: faker.number.int({ min: 0, max: 200 }),
      noxPPM: faker.number.float({ min: 0, max: 50, multipleOf: 0.1 }),
      pm25Level: faker.number.float({ min: 0, max: 20, multipleOf: 0.1 }),
      plateNumber: device.plateNumber,
vehicleId: device.vehicleId!, 
      trackingDeviceId: device.id,
      createdAt: new Date(),
      deletedAt: null
    }));

    await prisma.emissionData.createMany({ data: emissionData });
    recordCount += emissionData.length;
    console.log(`✅ Inserted ${recordCount} / ${totalRecords} records (Emission)`);

    // Seed Fuel Data
    const fuelData = Array.from({ length: RECORDS_PER_DATA_TYPE }, () => ({
      timestamp: faker.date.recent({ days: 30 }),
      fuelLevel: faker.number.float({ min: 0, max: 100, multipleOf: 0.1 }),
      fuelConsumption: faker.number.float({ min: 0, max: 20, multipleOf: 0.1 }),
      plateNumber: device.plateNumber,
      trackingDeviceId: device.id,
      vehicleId: device.vehicleId!,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await prisma.fuelData.createMany({ data: fuelData });
    recordCount += fuelData.length;
    console.log(`✅ Inserted ${recordCount} / ${totalRecords} records (Fuel)`);

    // Seed OBD Data
    const obdData = Array.from({ length: RECORDS_PER_DATA_TYPE }, () => ({
      timestamp: faker.date.recent({ days: 30 }),
      rpm: faker.number.int({ min: 500, max: 5000 }),
      plateNumber: device.plateNumber,
      throttlePosition: faker.number.float({ min: 0, max: 100, multipleOf: 0.1 }),
      engineTemperature: faker.number.float({ min: 70, max: 120, multipleOf: 0.1 }),
      engineStatus: faker.helpers.arrayElement(['Normal', 'Warning', 'Error']),
      faultCodes: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => 
        `P${faker.number.int({ min: 100, max: 999 })}`
      ),
      vehicleId: device.vehicleId!,
      trackingDeviceId: device.id,
      createdAt: new Date()
    }));

    await prisma.oBDData.createMany({ data: obdData });
    recordCount += obdData.length;
    console.log(`✅ Inserted ${recordCount} / ${totalRecords} records (OBD)`);
  }

  console.log(`🎉 Finished seeding ${recordCount} data records.`);
}

// Seed Alerts
async function seedAlerts() {
  console.log('🌱 Seeding Alerts...');
  
  const users = await prisma.user.findMany({ select: { id: true } });
  const vehicles = await prisma.vehicle.findMany({ 
    select: { id: true, plateNumber: true, userId: true } 
  });
  const notificationTypes = Object.values(NotificationType);

const alerts: Prisma.AlertCreateManyInput[] = [];
  
  // Create alerts for each user
  for (const user of users) {
    // Get this user's vehicles
    const userVehicles = vehicles.filter(v => v.userId === user.id);
    
    // Create 5-10 alerts per user
    const alertCount = faker.number.int({ min: 5, max: 10 });
    
    for (let i = 0; i < alertCount; i++) {
      const vehicle = faker.helpers.arrayElement(userVehicles);
      const type = faker.helpers.arrayElement(notificationTypes);
      
      let title, message, triggerValue, triggerThreshold;
      
      switch (type) {
        case NotificationType.HIGH_EMISSION_ALERT:
          title = 'High Emission Detected';
          message = `Vehicle ${vehicle.plateNumber} has exceeded emission thresholds`;
          triggerValue = `${faker.number.float({ min: 4, max: 6, multipleOf: 0.1 })}% CO2`;
          triggerThreshold = '4.0% CO2';
          break;
        case NotificationType.DIAGNOSTIC_FAULT_NOTIFICATION:
          title = 'Diagnostic Fault Detected';
          message = `Vehicle ${vehicle.plateNumber} has reported engine fault codes`;
          triggerValue = faker.helpers.arrayElement(['P0172', 'P0300', 'P0420']);
          triggerThreshold = 'Normal range';
          break;
        case NotificationType.FUEL_ANOMALY_ALERT:
          title = 'Fuel Anomaly Detected';
          message = `Vehicle ${vehicle.plateNumber} is consuming fuel at an abnormal rate`;
          triggerValue = `${faker.number.float({ min: 15, max: 25, multipleOf: 0.1 })} L/100km`;
          triggerThreshold = '10.0 L/100km';
          break;
        case NotificationType.DEVICE_OFFLINE_WARNING:
          title = 'Device Offline';
          message = `Tracking device for vehicle ${vehicle.plateNumber} is not responding`;
          triggerValue = 'Offline';
          triggerThreshold = 'Online';
          break;
        case NotificationType.SPEED_VIOLATION_ALERT:
          title = 'Speed Violation';
          message = `Vehicle ${vehicle.plateNumber} exceeded speed limit`;
          triggerValue = `${faker.number.int({ min: 80, max: 120 })} km/h`;
          triggerThreshold = '60 km/h';
          break;
      }
      
      alerts.push({
        type,
        title,
        message,
        isRead: faker.datatype.boolean(),
        triggerValue,
        triggerThreshold,
        vehicleId: vehicle.id,
        userId: user.id,
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }

  // Batch insert alerts
  const batchSize = 500;
  for (let i = 0; i < alerts.length; i += batchSize) {
    const batch = alerts.slice(i, i + batchSize);
    await prisma.alert.createMany({ data: batch });
    console.log(`✅ Inserted ${Math.min(i + batchSize, alerts.length)} / ${alerts.length} alerts`);
  }

  console.log(`🎉 Finished seeding ${alerts.length} alerts.`);
}

// Seed Additional Models
async function seedAdditionalModels() {
  console.log('🌱 Seeding Additional Models...');
  
  // Seed Connection States
  const vehicles = await prisma.vehicle.findMany({ select: { id: true } });
  const connectionStates = vehicles.map(vehicle => ({
    vehicleId: vehicle.id,
    socketId: faker.string.uuid(),
    status: faker.helpers.arrayElement(Object.values(ConnectionStatus)),
    lastUpdated: faker.date.recent()
  }));
  
  await prisma.connectionState.createMany({ data: connectionStates });
  console.log(`✅ Inserted ${connectionStates.length} connection states`);

  // Seed Device Heartbeats
  const devices = await prisma.trackingDevice.findMany({ select: { id: true } });
const heartbeats: Prisma.DeviceHeartbeatCreateManyInput[] = [];
  
  for (const device of devices) {
    for (let i = 0; i < 5; i++) {
      heartbeats.push({
        deviceId: device.id,
        status: faker.helpers.arrayElement(Object.values(ConnectionStatus)),
        timestamp: faker.date.recent({ days: 7 })
      });
    }
  }
  
  await prisma.deviceHeartbeat.createMany({ data: heartbeats });
  console.log(`✅ Inserted ${heartbeats.length} device heartbeats`);

  // Seed Reports
  const users = await prisma.user.findMany({ select: { id: true } });
const reports: Prisma.ReportCreateManyInput[] = [];
  
  for (let i = 0; i < ADDITIONAL_RECORDS; i++) {
    const user = faker.helpers.arrayElement(users);
    const vehicleIds = faker.helpers.arrayElements(
      vehicles,
      faker.number.int({ min: 1, max: 5 })
    ).map(v => v.id);
    
    reports.push({
      title: faker.lorem.words(3),
      type: faker.helpers.arrayElement(['Emission', 'Fuel', 'Maintenance', 'Activity']),
      format: faker.helpers.arrayElement(['PDF', 'CSV', 'Excel']),
      filePath: faker.system.filePath(),
      dateFrom: faker.date.past({ years: 1 }),
      dateTo: faker.date.recent(),
      vehicleIds,
      status: faker.helpers.arrayElement(['Generated', 'Pending', 'Failed']),
      userId: user.id,
      createdAt: faker.date.recent()
    });
  }
  
  await prisma.report.createMany({ data: reports });
  console.log(`✅ Inserted ${reports.length} reports`);

  // Seed Maintenance Records
const maintenanceRecords: Prisma.MaintenanceRecordCreateManyInput[] = [];
  
  for (const vehicle of vehicles.slice(0, ADDITIONAL_RECORDS)) {
    maintenanceRecords.push({
      type: faker.helpers.arrayElement(['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Engine Tune-up']),
      description: faker.lorem.sentence(),
      recommendedAction: faker.lorem.sentence(),
      cost: faker.number.float({ min: 50, max: 500, multipleOf: 0.01 }),
      performedAt: faker.date.past({ years: 1 }),
      nextDueDate: faker.date.future({ years: 1 }),
      vehicleId: vehicle.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  await prisma.maintenanceRecord.createMany({ data: maintenanceRecords });
  console.log(`✅ Inserted ${maintenanceRecords.length} maintenance records`);

  // Seed Activity Logs
const activityLogs: Prisma.ActivityLogCreateManyInput[] = [];
  
  for (const user of users.slice(0, ADDITIONAL_RECORDS)) {
    activityLogs.push({
      userId: user.id,
      action: faker.helpers.arrayElement(['Login', 'Logout', 'Report Generated', 'Alert Viewed']),
      metadata: JSON.stringify({
        ip: faker.internet.ip(),
        device: faker.helpers.arrayElement(['Windows', 'Mac', 'iOS', 'Android'])
      }),
      timestamp: faker.date.recent()
    });
  }
  
  await prisma.activityLog.createMany({ data: activityLogs });
  console.log(`✅ Inserted ${activityLogs.length} activity logs`);

  // Seed Inventory Items
  const inventoryItems = Array.from({ length: 10 }, (_, i) => ({
    deviceType: `Device Model ${i + 1}`,
    quantity: faker.number.int({ min: 0, max: 100 }),
    threshold: faker.number.int({ min: 5, max: 20 }),
    updatedAt: new Date()
  }));
  
  await prisma.inventoryItem.createMany({ data: inventoryItems });
  console.log(`✅ Inserted ${inventoryItems.length} inventory items`);

  // Seed Threshold Configs
  const thresholdConfigs = [
    { parameter: 'CO2', maxValue: 4.0, minValue: 0, alertType: NotificationType.HIGH_EMISSION_ALERT },
    { parameter: 'Speed', maxValue: 60, minValue: 0, alertType: NotificationType.SPEED_VIOLATION_ALERT },
    { parameter: 'Fuel Consumption', maxValue: 10, minValue: 0, alertType: NotificationType.FUEL_ANOMALY_ALERT },
    { parameter: 'Device Offline', maxValue: 1, minValue: 0, alertType: NotificationType.DEVICE_OFFLINE_WARNING },
    { parameter: 'Engine Fault', maxValue: 1, minValue: 0, alertType: NotificationType.DIAGNOSTIC_FAULT_NOTIFICATION }
  ];
  
  await prisma.thresholdConfig.createMany({ data: thresholdConfigs });
  console.log(`✅ Inserted ${thresholdConfigs.length} threshold configs`);

  // Seed Solutions
  const solutions = Array.from({ length: 6 }, (_, i) => ({
    title: faker.lorem.words(3),
    subtitle: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    content: faker.lorem.paragraphs(3),
    icon: faker.image.urlLoremFlickr({ category: 'technology' }),
    type: faker.helpers.arrayElement(Object.values(SolutionType)),
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.solution.createMany({ data: solutions });
  console.log(`✅ Inserted ${solutions.length} solutions`);

  // Seed Testimonials
  const createdSolutions = await prisma.solution.findMany({ select: { id: true } });
const testimonials: Prisma.TestimonialCreateManyInput[] = [];
  
  for (const solution of createdSolutions) {
    for (let i = 0; i < 3; i++) {
      testimonials.push({
        name: faker.person.fullName(),
        position: faker.person.jobTitle(),
        company: faker.company.name(),
        content: faker.lorem.paragraph(),
        imageUrl: faker.image.avatar(),
        solutionId: solution.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  await prisma.testimonial.createMany({ data: testimonials });
  console.log(`✅ Inserted ${testimonials.length} testimonials`);

  // Seed Values
  const values = [
    {
      title: 'Innovation',
      description: 'We constantly push boundaries to develop cutting-edge solutions.',
      icon: 'lightbulb',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Sustainability',
      description: 'Our solutions contribute to a greener and cleaner environment.',
      icon: 'leaf',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Reliability',
      description: 'Our systems are built to perform consistently under all conditions.',
      icon: 'shield',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await prisma.value.createMany({ data: values });
  console.log(`✅ Inserted ${values.length} values`);

  // Seed Products
  const products = [
    {
      name: 'Emission Tracker Pro',
      description: 'Advanced emission monitoring for fleets',
      content: faker.lorem.paragraphs(3),
      icon: 'activity',
      iconBackgroundColor: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Fleet Manager',
      description: 'Comprehensive fleet management solution',
      content: faker.lorem.paragraphs(3),
      icon: 'truck',
      iconBackgroundColor: '#10b981',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Fuel Efficiency Monitor',
      description: 'Optimize fuel consumption across your fleet',
      content: faker.lorem.paragraphs(3),
      icon: 'droplet',
      iconBackgroundColor: '#f59e0b',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await prisma.product.createMany({ data: products });
  console.log(`✅ Inserted ${products.length} products`);

  // Seed Features
  const createdProducts = await prisma.product.findMany({ select: { id: true } });
const features: Prisma.FeatureCreateManyInput[] = [];

  
  for (const product of createdProducts) {
    for (let i = 0; i < 5; i++) {
      features.push({
        title: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        icon: faker.helpers.arrayElement(['settings', 'bar-chart', 'alert-circle', 'map', 'cpu']),
        productId: product.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  await prisma.feature.createMany({ data: features });
  console.log(`✅ Inserted ${features.length} features`);

  // Seed Technologies
  const technologies = [
    { name: 'IoT', description: 'Internet of Things connectivity', icon: 'wifi' },
    { name: 'AI Analytics', description: 'Artificial Intelligence for predictive analysis', icon: 'cpu' },
    { name: 'Cloud Computing', description: 'Scalable cloud infrastructure', icon: 'cloud' },
    { name: 'Big Data', description: 'Processing large datasets efficiently', icon: 'database' }
  ].map(tech => ({
    ...tech,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.technology.createMany({ data: technologies });
  console.log(`✅ Inserted ${technologies.length} technologies`);

  // Seed Team
  const teamMembers = [
    { name: 'John Doe', position: 'CEO', department: Department.LEADERSHIP },
    { name: 'Jane Smith', position: 'CTO', department: Department.LEADERSHIP },
    { name: 'Mike Johnson', position: 'Lead Engineer', department: Department.ENGINEERING },
    { name: 'Sarah Williams', position: 'Operations Manager', department: Department.OPERATIONS }
  ].map(member => ({
    ...member,
    description: faker.lorem.paragraph(),
    imageUrl: faker.image.avatar(),
    socialLinks: JSON.stringify({
      twitter: faker.internet.url(),
      linkedin: faker.internet.url()
    }),
    experienceYears: faker.number.int({ min: 5, max: 20 }),
    location: faker.location.city(),
    profileUrl: faker.internet.url(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.team.createMany({ data: teamMembers });
  console.log(`✅ Inserted ${teamMembers.length} team members`);

  // Seed Advisory Board
  const advisoryBoard = Array.from({ length: 5 }, (_, i) => ({
    name: faker.person.fullName(),
    position: faker.person.jobTitle(),
    company: faker.company.name(),
    highlight: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    imageUrl: faker.image.avatar(),
    socialLinks: JSON.stringify({
      twitter: faker.internet.url(),
      linkedin: faker.internet.url()
    }),
    fullBioLink: faker.internet.url(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.advisoryBoard.createMany({ data: advisoryBoard });
  console.log(`✅ Inserted ${advisoryBoard.length} advisory board members`);

  // Seed Partner Categories
  const partnerCategories = [
    { name: 'Technology', icon: 'cpu' },
    { name: 'Automotive', icon: 'car' },
    { name: 'Government', icon: 'shield' },
    { name: 'NGO', icon: 'heart' }
  ].map(cat => ({
    ...cat,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.partnerCategory.createMany({ data: partnerCategories });
  console.log(`✅ Inserted ${partnerCategories.length} partner categories`);

  // Seed Partners
  const createdCategories = await prisma.partnerCategory.findMany({ select: { id: true } });
const partners: Prisma.PartnerCreateManyInput[] = [];

  
  for (const category of createdCategories) {
    for (let i = 0; i < 5; i++) {
      partners.push({
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
        logoUrl: faker.image.urlLoremFlickr({ category: 'logo' }),
        websiteUrl: faker.internet.url(),
        categoryId: category.id,
        keyImpact: faker.lorem.sentence(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  await prisma.partner.createMany({ data: partners });
  console.log(`✅ Inserted ${partners.length} partners`);

  // Seed Partnership Reasons
  const partnershipReasons = [
    { title: 'Shared Vision', description: 'Align with our mission for cleaner transportation', icon: 'eye' },
    { title: 'Market Expansion', description: 'Access new markets and customers', icon: 'globe' },
    { title: 'Technology Integration', description: 'Leverage our cutting-edge technology', icon: 'cpu' },
    { title: 'Sustainability Goals', description: 'Achieve your environmental targets', icon: 'leaf' }
  ].map(reason => ({
    ...reason,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.partnershipReason.createMany({ data: partnershipReasons });
  console.log(`✅ Inserted ${partnershipReasons.length} partnership reasons`);

  // Seed Blog Posts
const blogPosts: Prisma.BlogPostCreateManyInput[] = [];

  
  for (let i = 0; i < ADDITIONAL_RECORDS; i++) {
    const user = faker.helpers.arrayElement(users);
    blogPosts.push({
      title: faker.lorem.words(5),
      slug: faker.helpers.slugify(faker.lorem.words(5)),
      content: faker.lorem.paragraphs(5),
      summary: faker.lorem.sentence(),
      imageUrl: faker.image.urlLoremFlickr({ category: 'technology' }),
      authorId: user.id,
      tags: faker.helpers.arrayElements(
        ['Technology', 'Sustainability', 'Transport', 'Innovation', 'Fleet Management'],
        { min: 1, max: 3 }
      ),
      category: faker.helpers.arrayElement(['Technology', 'Business', 'Environment']),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent()
    });
  }
  
  await prisma.blogPost.createMany({ data: blogPosts });
  console.log(`✅ Inserted ${blogPosts.length} blog posts`);

  // Seed Contact Messages
  const contactMessages = Array.from({ length: ADDITIONAL_RECORDS }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: faker.lorem.words(3),
    message: faker.lorem.paragraph(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent()
  }));
  
  await prisma.contactMessage.createMany({ data: contactMessages });
  console.log(`✅ Inserted ${contactMessages.length} contact messages`);

  console.log('🎉 Finished seeding all additional models.');
}

// Main seeding function
async function main() {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Clean the database first
    await cleanDatabase();
    
    // Seed all data
    await seedUsers();
    await seedVehicles();
    await seedTrackingDevices();
    await seedDataRecords();
    await seedAlerts();
    await seedAdditionalModels();
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });