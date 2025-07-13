
import prisma from"../src/config/db"
import { UserRole, UserStatus, FuelType, VehicleStatus, NotificationType, DeviceCategory, CommunicationProtocol, DeviceStatus } from '@prisma/client'
import {passHashing} from '../src/utils/passwordfunctions'
// Predefined IDs for relationships
const USER_IDS = {
  ADMIN: 1,
  FLEET_MANAGER: 2,
  TECHNICIAN: 3
}

const VEHICLE_IDS = {
  TRUCK_001: 1,
  CAR_001: 2,
  MOTORCYCLE_001: 3
}

const DEVICE_IDS = {
  DEVICE_001: 1,
  DEVICE_002: 2,
  DEVICE_003: 3
}
async function seedUsers() {
  console.log('🌱 Seeding Users...')
  const hashedPassword = await passHashing('password123')

  // Keep predefined core users
  const baseUsers = [
    {
      id: USER_IDS.ADMIN,
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
      id: USER_IDS.FLEET_MANAGER,
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
      id: USER_IDS.TECHNICIAN,
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

  // Generate 1000 additional users
  const bulkUsers = Array.from({ length: 1000 }, (_, i) => {
    const index = i + 4 // start from ID 4
    return {

      username: `user${index}`,
      email: `user${index}@example.com`,
      password: hashedPassword,
      nationalId: `ID-${index.toString().padStart(9, '0')}`,
      gender: index % 2 === 0 ? 'Male' : 'Female',
      phoneNumber: `+250788${(100000 + index).toString().slice(-6)}`,
      location: 'Rwanda',
      companyName: `Company ${index}`,
      companyRegistrationNumber: `RW-REG-${index}`,
      businessSector: 'Transport',
      fleetSize: Math.floor(Math.random() * 100),
      language: 'English',
      notificationPreference: index % 2 === 0 ? 'Email' : 'SMS',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  const allUsers = [...baseUsers, ...bulkUsers]

  for (const user of allUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    })
  }

  console.log(`✅ Seeded ${allUsers.length} users successfully`)
}

async function seedVehicles() {
  console.log('🌱 Seeding Vehicles...')
  
  const vehicles = [
    {
      id: VEHICLE_IDS.TRUCK_001,
      plateNumber: 'RAD-001-T',
      registrationNumber: 'RW-VEH-001',
      chassisNumber: 'TRUCK123456789',
      vehicleType: 'Heavy Truck',
      vehicleModel: 'Isuzu FVR',
      yearOfManufacture: 2020,
      usage: 'Commercial Transport',
      fuelType: FuelType.DIESEL,
      status: VehicleStatus.NORMAL_EMISSION,
      emissionStatus: 'NORMAL' as any, // Replace 'as any' with EmissionStatus.NORMAL if you import the enum
      lastMaintenanceDate: new Date('2024-06-15'),
      userId: USER_IDS.FLEET_MANAGER,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: VEHICLE_IDS.CAR_001,
      plateNumber: 'RAD-002-C',
      registrationNumber: 'RW-VEH-002',
      chassisNumber: 'CAR987654321',
      vehicleType: 'Sedan',
      vehicleModel: 'Toyota Camry',
      yearOfManufacture: 2022,
      usage: 'Executive Transport',
      fuelType: FuelType.PETROL,
      status: VehicleStatus.NORMAL_EMISSION,
      emissionStatus: 'LOW' as any, // Replace 'as any' with EmissionStatus.LOW if you import the enum
      lastMaintenanceDate: new Date('2024-06-20'),
      userId: USER_IDS.ADMIN,
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05')
    },
    {
      id: VEHICLE_IDS.MOTORCYCLE_001,
      plateNumber: 'RAD-003-M',
      registrationNumber: 'RW-VEH-003',
      chassisNumber: 'MOTO456789123',
      vehicleType: 'Motorcycle',
      vehicleModel: 'Honda CRF 250',
      yearOfManufacture: 2023,
      usage: 'Delivery Service',
      fuelType: FuelType.PETROL,
      status: VehicleStatus.NORMAL_EMISSION,
      emissionStatus: 'LOW',
      lastMaintenanceDate: new Date('2024-06-25'),
      userId: USER_IDS.TECHNICIAN,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    }
  ]

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      update: vehicle,
      create: vehicle
    })
  }

  console.log('✅ Vehicles seeded successfully')
}

async function seedTrackingDevices() {
  console.log('🌱 Seeding Tracking Devices...')
  
  const devices = [
    {
      id: DEVICE_IDS.DEVICE_001,
      serialNumber: 'TRK-DEV-001',
      model: 'GPS-Pro-X1',
      type: 'Advanced Fleet Tracker',
      plateNumber: 'RAD-001-T',
      batteryLevel: 85.5,
      signalStrength: 92,
      deviceCategory: DeviceCategory.TRUCK,
      firmwareVersion: '2.1.5',
      simCardNumber: '250788001001',
      installationDate: new Date('2024-02-01'),
      communicationProtocol: CommunicationProtocol.MQTT,
      dataTransmissionInterval: '30 seconds',
      enableOBDMonitoring: true,
      enableGPSTracking: true,
      enableEmissionMonitoring: true,
      enableFuelMonitoring: true,
      isActive: true,
      status: DeviceStatus.ACTIVE,
      lastPing: new Date(),
      userId: USER_IDS.FLEET_MANAGER,
      vehicleId: VEHICLE_IDS.TRUCK_001,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: DEVICE_IDS.DEVICE_002,
      serialNumber: 'TRK-DEV-002',
      model: 'GPS-Lite-Y2',
      type: 'Standard Vehicle Tracker',
      plateNumber: 'RAD-002-C',
      batteryLevel: 92.3,
      signalStrength: 88,
      deviceCategory: DeviceCategory.CAR,
      firmwareVersion: '1.8.3',
      simCardNumber: '250788002002',
      installationDate: new Date('2024-02-05'),
      communicationProtocol: CommunicationProtocol.HTTP,
      dataTransmissionInterval: '1 minute',
      enableOBDMonitoring: true,
      enableGPSTracking: true,
      enableEmissionMonitoring: true,
      enableFuelMonitoring: false,
      isActive: true,
      status: DeviceStatus.ACTIVE,
      lastPing: new Date(),
      userId: USER_IDS.ADMIN,
      vehicleId: VEHICLE_IDS.CAR_001,
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05')
    },
    {
      id: DEVICE_IDS.DEVICE_003,
      serialNumber: 'TRK-DEV-003',
      model: 'GPS-Mini-Z3',
      type: 'Compact Tracker',
      plateNumber: 'RAD-003-M',
      batteryLevel: 78.9,
      signalStrength: 95,
      deviceCategory: DeviceCategory.MOTORCYCLE,
      firmwareVersion: '1.5.2',
      simCardNumber: '250788003003',
      installationDate: new Date('2024-02-10'),
      communicationProtocol: CommunicationProtocol.MQTT,
      dataTransmissionInterval: '2 minutes',
      enableOBDMonitoring: false,
      enableGPSTracking: true,
      enableEmissionMonitoring: false,
      enableFuelMonitoring: true,
      isActive: true,
      status: DeviceStatus.ACTIVE,
      
      lastPing: new Date(),
      userId: USER_IDS.TECHNICIAN,
      vehicleId: VEHICLE_IDS.MOTORCYCLE_001,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    }
  ]

  for (const device of devices) {
    await prisma.trackingDevice.upsert({
      where: { id: device.id },
      update: device,
      create: device
    })
  }

  console.log('✅ Tracking Devices seeded successfully')
}

async function seedRelatedData() {
  console.log('🌱 Seeding Related Data...')
  
  // Seed some sample GPS data
  const gpsData = [
    {
      latitude: -1.9441,
      longitude: 30.0619,
      plateNumber: 'RAD-001-T',
      speed: 45.5,
      accuracy: 98.2,
      vehicleId: VEHICLE_IDS.TRUCK_001,
      trackingDeviceId: DEVICE_IDS.DEVICE_001,
      trackingStatus: true,
      timestamp: new Date()
    },
    {
      latitude: -1.9506,
      longitude: 30.0588,
      plateNumber: 'RAD-002-C',
      speed: 32.1,
      accuracy: 95.8,
      vehicleId: VEHICLE_IDS.CAR_001,
      trackingDeviceId: DEVICE_IDS.DEVICE_002,
      trackingStatus: true,
      timestamp: new Date()
    }
  ]

  for (const gps of gpsData) {
    await prisma.gpsData.create({ data: gps })
  }

  // Seed some emission data
  const emissionData = [
    {
      timestamp: new Date(),
      co2Percentage: 4.2,
      coPercentage: 0.8,
      o2Percentage: 18.5,
      hcPPM: 120,
      noxPPM: 45.2,
      pm25Level: 15.8,
      vehicleId: VEHICLE_IDS.TRUCK_001,
      plateNumber: 'RAD-001-T',
      trackingDeviceId: DEVICE_IDS.DEVICE_001
    },
    {
      timestamp: new Date(),
      co2Percentage: 3.8,
      coPercentage: 0.5,
      o2Percentage: 19.2,
      hcPPM: 85,
      noxPPM: 32.1,
      pm25Level: 8.4,
      vehicleId: VEHICLE_IDS.CAR_001,
      plateNumber: 'RAD-002-C',
      trackingDeviceId: DEVICE_IDS.DEVICE_002
    }
  ]

  for (const emission of emissionData) {
    await prisma.emissionData.create({ data: emission })
  }

  // Seed some alerts
  const alerts = [
    {
      type: NotificationType.HIGH_EMISSION_ALERT,
      title: 'High Emission Detected',
      message: 'Vehicle RAD-001-T has exceeded emission thresholds',
      triggerValue: '4.2%',
      triggerThreshold: '4.0%',
      vehicleId: VEHICLE_IDS.TRUCK_001,
      userId: USER_IDS.FLEET_MANAGER,
      isRead: false
    },
    {
      type: NotificationType.SPEED_VIOLATION_ALERT,
      title: 'Speed Limit Exceeded',
      message: 'Vehicle RAD-002-C exceeded speed limit in urban area',
      triggerValue: '85 km/h',
      triggerThreshold: '50 km/h',
      vehicleId: VEHICLE_IDS.CAR_001,
      userId: USER_IDS.ADMIN,
      isRead: false
    }
  ]

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert })
  }

  console.log('✅ Related data seeded successfully')
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...')
    
    await seedUsers()
    await seedVehicles()
    await seedTrackingDevices()
    await seedRelatedData()
    
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeder
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

  export {
    seedUsers,
    seedVehicles,
    seedTrackingDevices,
    seedRelatedData,
    USER_IDS,
    VEHICLE_IDS,
    DEVICE_IDS
  }
  