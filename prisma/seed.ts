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
  Prisma,
  PartnerCategory
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
  // Seed Solutions
const solutions = [
  {
    icon: 'shield', // store as string for later mapping to <Shield />
    title: 'Emissions Monitoring',
    subtitle: 'Real-time tracking',
    description:
      "Best for regulatory compliance and fleet optimization, until you're ready for full electrification.",
    content:'',
    type: SolutionType.LOW_RISK,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    icon: 'zap',
    title: 'Electric Tricycles',
    subtitle: 'Zero emissions transport',
    description:
      'Purpose-built vehicles that earn steady performance and are considered ideal for rural logistics.',
    content:'',
    type: SolutionType.PROVEN_TECH,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    icon: 'trending-up',
    title: 'IoT Fleet Management',
    subtitle: 'Smart operations',
    description:
      'The data-driven method designed to maximize efficiency over the long term, while we automatically manage the insights.',
    content:'',
    type: SolutionType.HIGH_IMPACT,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];


await prisma.solution.createMany({ data: solutions });
console.log(`✅ Inserted ${solutions.length} solutions`);

// Seed Testimonials
const createdSolutions = await prisma.solution.findMany({
  select: { id: true, title: true },
});

const testimonials = [
  {
     quote:
      'The single best resource for rural logistics and seeing our entire transport picture.',
    name: 'Transport Ministry',
    product: 'Emissions Monitoring',
    position: 'Senior Accountability Orchestrator at Pollich',
    company: 'Abshire and Corkery',
  },
  {
    quote:
      'The single best resource for rural logistics and seeing our entire transport picture.',
    name: 'Agricultural Cooperative',
    product: 'Electric Tricycles',
    position: 'Senior Accountability Orchestrator at Pollich',
    company: 'Abshire and Corkery',

  },
  {
    quote:
      'I LOVE Greenalytic and have moved almost all of our fleet monitoring there.',
    name: 'Fleet Manager',
    product: 'IoT Fleet Management',
    position: 'Senior Accountability Orchestrator at Pollich',
    company: 'Abshire and Corkery',
  },
];

const testimonialsData = testimonials
  .map((t) => {
    const relatedSolution = createdSolutions.find(
      (s) => s.title === t.product || t.product.includes(s.title)
    );
    
    if (!relatedSolution) {
      console.warn(`⚠️ No solution found for testimonial product: ${t.product}`);
      return null;
    }
    
    return {
      name: t.name,
      position: t.position || 'Senior Accountability Orchestrator at Pollich',
      company: t.company || 'Abshire and Corkery',
      content: t.quote,
      imageUrl: '',
      solutionId: relatedSolution.id, // Now guaranteed to exist
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  })
  .filter((t): t is NonNullable<typeof t> => t !== null); // Remove nulls

await prisma.testimonial.createMany({ data: testimonialsData });
console.log(`✅ Inserted ${testimonialsData.length} testimonials`);

  // Seed Values
  const values = [
    {
      title: 'Innovation',
      description: 'We design cutting-edge clean mobility solutions that suit local contexts and address real-world challenges.',
      icon: 'lightbulb',
      iconBackgroundColor: 'bg-blue-500',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Impact',
      description: 'We aim for real change by empowering communities through green transport solutions that make a difference.',
      icon: 'target',
      iconBackgroundColor: 'bg-emerald-500',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Sustainability',
      description: 'Our technologies are built for long-term ecological and economic resilience across African markets.',
      icon: 'leaf',
      iconBackgroundColor: 'bg-green-500',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await prisma.value.createMany({ data: values });
  console.log(`✅ Inserted ${values.length} values`);

  // Seed Products
  const products = [
    {
      name: 'Emission Monitoring Device',
      description: 'Smart real-time vehicle emissions tracking',
      content: 'A comprehensive in-vehicle IoT device providing real-time data on emissions, GPS tracking, fuel consumption, speed monitoring, and intelligent alerts for enhanced fleet management and regulatory compliance.',
      icon: 'monitor',
      iconBackgroundColor: '#3b82f6',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'OBD II Scanner',
      description: 'Advanced vehicle diagnostics tool',
      content: 'Plug-and-play diagnostic device that tracks engine temperature, detects system faults, evaluates vehicle health status, and provides comprehensive maintenance insights for optimal vehicle performance.',
      icon: 'search',
      iconBackgroundColor: '#10b981',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Electric Cargo Tricycle',
      description: 'Zero-emission rural transport solution',
      content: 'Specially engineered electric tricycle for transporting agricultural goods with extended range, minimal maintenance requirements, and ruggedized design optimized for challenging rural road conditions.',
      icon: 'truck',
      iconBackgroundColor: '#f59e0b',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Vehicle Data Dashboard',
      description: 'Comprehensive fleet management platform',
      content: 'Web-based analytics platform offering emissions visualization, GPS tracking, fuel consumption analysis, and customizable fleet insights with real-time monitoring and comprehensive reporting capabilities.',
      icon: 'bar-chart-3',
      iconBackgroundColor: '#f59e0b',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await prisma.product.createMany({ data: products });
  console.log(`✅ Inserted ${products.length} products`);

  // Seed Features
const createdProducts = await prisma.product.findMany({ select: { id: true, name:true } });
const features: Prisma.FeatureCreateManyInput[] = [];

  
  const productFeatures: Record<string, { title: string; description: string; icon: string }[]> = {
    // Emission Monitoring Device
    "Emission Monitoring Device": [
      {
        title: "Real-time Data",
        description: "Live emissions monitoring",
        icon: "wifi",
      },
      {
        title: "GPS Tracking",
        description: "Precise location data",
        icon: "map-pin",
      },
      {
        title: "Compliance",
        description: "Regulatory standards",
        icon: "shield",
      },
      {
        title: "Analysis",
        description: "Performance insights",
        icon: "bar-chart-3",
      }

    ],
    // OBD II Scanner
    "OBD II Scanner": [
      {
        title: "Engine Health",
        description: "Temperature monitoring.",
        icon: "monitor",
      },
      {
        title: "Fault Detection",
        description: "System diagnostics",
        icon: "shield",
      },
      {
        title: "Health Reports",
        description: "Vehicle status",
        icon: "bar-chart-3",
      },
      {
        title: "Fault Code Lookup",
        description: "Decode and explain OBD-II fault codes for quick troubleshooting.",
        icon: "search",
      },
      {
        title: "Quick Setup",
        description: "Plug-and-play",
        icon: "zap",
      },
    ],
    // Electric Cargo Tricycle
    "Electric Cargo Tricycle": [
      {
        title: "Zero Emissions",
        description: "Clean electric power",
        icon: "zap",
      },
      {
        title: "Rugged Design",
        description: "Built for rough roads",
        icon: "shield",
      },
      {
        title: "Long Range",
        description: "Extended battery life",
        icon: "bar-chart-3",
      },
      {
        title: "Low Maintenance",
        description: "Minimal upkeep",
        icon: "monitor",
      },
    ],
    // Vehicle Data Dashboard
    "Vehicle Data Dashboard": [
      {
        title: "Data Visualization",
        description: "Interactive charts",
        icon: "bar-chart-3",
      },
      {
        title: "Fleet Tracking",
        description: "Real-time locations",
        icon: "map-pin",
      },
      {
        title: "Custom Reports",
        description: "Tailored insights",
        icon: "monitor",
      },
      {
        title: "Live Updates",
        description: "24/7 monitoring",
        icon: "monitor",
      },

    ],
  };

  for (const product of createdProducts) {
    const productName = products.find(p => p.name === product.name)?.name || "";
    const featuresForProduct = productFeatures[productName] || [];
    for (const feature of featuresForProduct) {
      features.push({
        ...feature,
        productId: product.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  
  await prisma.feature.createMany({ data: features });
  console.log(`✅ Inserted ${features.length} features`);

  // Seed Technologies
  const technologies = [
    { name: 'IoT Integration', description: 'Advanced sensor networks for real-time data collection', icon: 'wifi', iconColor:'text-blue-600' },
    { name: 'Cloud Analytics', description: 'Powerful data processing and visualization platform', icon: 'bar-chart-3', iconColor:'text-emerald-600' },
    { name: 'Mobile First', description: 'Responsive design for on-the-go fleet management', icon: 'monitor', iconColor:'text-purple-600' },
  ].map(tech => ({
    ...tech,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await prisma.technology.createMany({ data: technologies });
  console.log(`✅ Inserted ${technologies.length} technologies`);

  // Seed Team
  console.log('Creating Team Members...');
    
    const teamMembersData = [
      {
        name: 'Emmanuel Tuyizere',
        position: 'Founder & CEO',
        department: Department.LEADERSHIP,
        description: 'Leads strategic vision, partnerships, and overall company direction. Oversees product development and drives clean mobility innovation across African markets.',
        imageFile: '/uploads/team/emmanuel.jpg',
        socialLinks: {
          linkedin: '#',
          email: 'emmanuel@greenalytic.rw'
        },
        experienceYears: 8,
        location: 'Kigali, Rwanda',
        profileUrl: null
      },
      {
        name: 'Eng. Tugimana Musa',
        position: 'Embedded Systems Engineer',
        department: Department.ENGINEERING,
        description: 'Designs and develops IoT hardware systems for emissions monitoring. Responsible for PCB design, sensor integration, and embedded firmware development.',
        imageFile: '/uploads/team/emmanuel.jpg',
        socialLinks: {
          linkedin: '#',
          email: 'mussa@greenalytic.rw'
        },
        experienceYears: 6,
        location: 'Kigali, Rwanda',
        profileUrl: null
      },
      // {
      //   name: 'Jean Baptista',
      //   position: 'Software Developer',
      //   department: Department.ENGINEERING,
      //   description: 'Builds web applications and dashboard interfaces for real-time data visualization. Develops APIs and manages system integration for client platforms.',
      //   imageFile: '/uploads/team/emmanuel.jpg',
      //   socialLinks: {
      //     linkedin: '#',
      //     email: 'baptista@greenalytic.rw'
      //   },
      //   experienceYears: 5,
      //   location: 'Kigali, Rwanda',
      //   profileUrl: null
      // },
      {
        name: 'Kellia Inkindi',
        position: 'Finance & Administration Officer',
        department: Department.OPERATIONS,
        description: 'Manages financial reporting, budget planning, and HR operations. Ensures compliance with grant requirements and oversees day-to-day administrative functions.',
        imageFile: '/uploads/team/kellia.jpg',
        socialLinks: {
          linkedin: '#',
          email: 'Kellia@greenalytic.rw'
        },
        experienceYears: 7,
        location: 'Kigali, Rwanda',
        profileUrl: null
      }
    ];

    for (const memberData of teamMembersData) {
      // Copy image file if it exists
      
      const teamMember = await prisma.team.create({
        data: {
          name: memberData.name,
          position: memberData.position,
          department: memberData.department,
          description: memberData.description,
          imageUrl: memberData.imageFile,
          socialLinks: memberData.socialLinks,
          experienceYears: memberData.experienceYears,
          location: memberData.location,
          profileUrl: memberData.profileUrl
        }
      });
      console.log(`✅ Created team member: ${teamMember.name} (${memberData.department})`);
    }

    // 2. Create Advisory Board Members
    console.log('Creating Advisory Board Members...');
    
    const advisoryMembersData = [
      {
        name: 'Dr. Kalisa Egide',
        position: 'Environmental Research Advisor',
        company: 'Western University of Ontario',
        highlight: 'PhD in Environmental Science',
        description: 'Provides scientific guidance on air quality monitoring and climate change adaptation. Advises on environmental health impact assessment and policy development.',
        imageFile: '/uploads/team/emmanuel.jpg',
        socialLinks: {
          linkedin: '#'
        },
        fullBioLink: null
      },
      {
        name: 'Dr. Innocent Nkurikiyimfura',
        position: 'Climate Innovation Advisor',
        company: 'University of Rwanda',
        highlight: '17+ years in energy systems',
        description: 'Guides sustainable technology development and renewable energy integration. Advises on climate-resilient innovations and greenhouse gas inventory methodologies.',
        imageFile: '/uploads/team/emmanuel.jpg',
        socialLinks: {
          linkedin: '#'
        },
        fullBioLink: null
      }
    ];

    for (const advisorData of advisoryMembersData) {
      // Copy image file if it exists
    

      const advisoryMember = await prisma.advisoryBoard.create({
        data: {
          name: advisorData.name,
          position: advisorData.position,
          company: advisorData.company,
          highlight: advisorData.highlight,
          description: advisorData.description,
          imageUrl: advisorData.imageFile,
          socialLinks: advisorData.socialLinks,
          fullBioLink: advisorData.fullBioLink
        }
      });
      console.log(`✅ Created advisory board member: ${advisoryMember.name}`);
    }

    // 3. Display summary
    const teamCount = await prisma.team.count();
    const advisoryCount = await prisma.advisoryBoard.count();
    
    console.log(`📊 Summary:`);
    console.log(`   - Team Members: ${teamCount}`);
    console.log(`   - Advisory Board Members: ${advisoryCount}`);
    
    // Show count by department
    const departmentCounts = {
      LEADERSHIP: await prisma.team.count({ where: { department: Department.LEADERSHIP } }),
      ENGINEERING: await prisma.team.count({ where: { department: Department.ENGINEERING } }),
      OPERATIONS: await prisma.team.count({ where: { department: Department.OPERATIONS } })
    };
    
    console.log(`   - Leadership: ${departmentCounts.LEADERSHIP} members`);
    console.log(`   - Engineering: ${departmentCounts.ENGINEERING} members`);
    console.log(`   - Operations: ${departmentCounts.OPERATIONS} members`);

    // Calculate total experience
    const totalExperience = await prisma.team.aggregate({
      _sum: {
        experienceYears: true
      }
    });
    console.log(`   - Total Experience: ${totalExperience._sum.experienceYears || 0} years`);

  // Seed Partner Categories
  const categoriesData = [
      {
        name: 'Institutional',
        icon: 'building'
      },
      {
        name: 'Academic', 
        icon: 'graduation-cap'
      },
      {
        name: 'Manufacturing',
        icon: 'factory'
      },
      {
        name: 'Strategic',
        icon: 'handshake'
      }
    ];

    const createdCategories: PartnerCategory[] = [];
    for (const categoryData of categoriesData) {
      const category = await prisma.partnerCategory.create({
        data: categoryData
      });
      createdCategories.push(category);
      console.log(`✅ Created partner category: ${category.name}`);
    }

  // Seed Partners
  console.log('Creating Partners...');
    
    const partnersData = [
      {
        name: 'NCST – National Council for Science and Technology',
        description: 'Funding and supporting cleantech innovation through research grants and infrastructure access.',
        logoUrl: '/uploads/partners/NCST.png',
        websiteUrl: 'https://www.ncst.gov.rw/',
        keyImpact: 'Research & Development Support',
        categoryName: 'Institutional'
      },
      {
        name: 'CMU-Africa – Carnegie Mellon University Africa',
        description: 'Technical partner providing research mentorship, systems design, and IoT collaboration.',
        logoUrl: '/uploads/partners/CMU - AFRICA.png',
        websiteUrl: 'https://www.africa.engineering.cmu.edu/',
        keyImpact: 'Technical Expertise & Innovation',
        categoryName: 'Academic'
      },
      {
        name: 'Mastercard Foundation',
        description: 'Supports youth employment, innovation, and inclusion in cleantech entrepreneurship.',
        logoUrl: '/uploads/partners/MASTERCARD FOUNDATION.png',
        websiteUrl: 'https://mastercardfdn.org/en/',
        keyImpact: 'Capacity Building & Employment',
        categoryName: 'Institutional'
      },
      {
        name: 'Rwanda ICT Chamber',
        description: 'Promotes local innovation, tech community building, and advocacy.',
        logoUrl: '/uploads/partners/ICT_CHAMBER.png',
        websiteUrl: 'https://rw.linkedin.com/company/rwanda-ict-chamber',
        keyImpact: 'Industry Networking & Advocacy',
        categoryName: 'Institutional'
      },
      {
        name: 'Beno Holding Ltd',
        description: 'Local engineering and production partner focused on scalable EV fabrication.',
        logoUrl: '/uploads/partners/BENO.png',
        websiteUrl: 'https://www.benoholdings.rw/',
        keyImpact: 'Local Manufacturing & Assembly',
        categoryName: 'Manufacturing'
      },
      {
        name: '250STARTUP',
        description: 'Incubation support, mentorship, and startup readiness acceleration.',
        logoUrl: '/uploads/partners/250 (2).png',
        websiteUrl: 'https://250.rw/',
        keyImpact: 'Business Development & Mentorship',
        categoryName: 'Strategic'
      },
      {
        name: 'ESP Partners',
        description: 'Strategic guidance on scaling operations and environmental impact finance.',
        logoUrl: '/uploads/partners/ESP.png',
        websiteUrl: 'https://espartners.co/',
        keyImpact: 'Strategic Planning & Finance',
        categoryName: 'Strategic'
      },
      {
        name: 'Rwanda Electric Motors (REM)',
        description: 'Partner in the e-mobility sector driving national adoption of electric vehicles.',
        logoUrl: '/uploads/partners/REM.png',
        websiteUrl: 'https://remrw.com/',
        keyImpact: 'Market Development & Adoption',
        categoryName: 'Strategic'
      },
      {
        name: 'REMA – Rwanda Environment Management Authority',
        description: 'Collaborates on air quality initiatives and emissions policy nationwide.',
        logoUrl: '/uploads/partners/REMA.png',
        websiteUrl: 'https://www.rema.gov.rw/home',
        keyImpact: 'Policy Development & Compliance',
        categoryName: 'Institutional'
      },
      {
        name: 'Tianjin Luobei – EV Manufacturer (China)',
        description: 'International partner supporting the design and supply of electric tricycle components.',
        logoUrl: '', // No logo provided in original
        websiteUrl: 'https://loboev.en.alibaba.com/',
        keyImpact: 'Technology Transfer & Components',
        categoryName: 'Manufacturing'
      },
      {
        name: 'SSM Factory – Clean Cooking Stove Manufacturer',
        description: 'Collaborates on local manufacturing strategies for sustainable energy technologies.',
        logoUrl: '', // No logo provided in original
        websiteUrl: 'https://www.ssmstove.com/',
        keyImpact: 'Local Production Expertise',
        categoryName: 'Manufacturing'
      }
    ];

    for (const partnerData of partnersData) {
      // Find the category by name
      const category = createdCategories.find(cat => cat.name === partnerData.categoryName);
      
      if (category) {
        const partner = await prisma.partner.create({
          data: {
            name: partnerData.name,
            description: partnerData.description,
            logoUrl: partnerData.logoUrl,
            websiteUrl: partnerData.websiteUrl,
            keyImpact: partnerData.keyImpact,
            categoryId: category.id
          }
        });
        console.log(`✅ Created partner: ${partner.name} (${partnerData.categoryName})`);
      } else {
        console.error(`❌ Category '${partnerData.categoryName}' not found for partner: ${partnerData.name}`);
      }
    }

  // Seed Partnership Reasons
  const partnershipReasons = [
    { title: 'Local Expertise', description: 'Deep understanding of African markets and conditions', icon: 'globe' },
    { title: 'Proven Team', description: 'Experienced professionals with track record of success', icon: 'users' },
    { title: 'Clear Impact', description: 'Measurable results in clean mobility and emissions reduction', icon: 'target' },
    { title: 'Innovation Focus', description: 'Cutting-edge solutions designed for real-world challenges', icon: 'zap' }
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
      imageUrl: '/uploads/blog/emmanuel.jpg',
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