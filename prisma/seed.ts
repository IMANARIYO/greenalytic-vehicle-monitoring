
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

const BATCH_SIZE = 500

async function seedVehicles() {
  console.log("🌱 Seeding Vehicles...")

  const users = await prisma.user.findMany({ select: { id: true } })

  const fuelTypes = Object.values(FuelType)
  const statuses = Object.values(VehicleStatus)
  const emissionStatuses = ["NORMAL", "LOW", "HIGH"]
  const vehicleModels = ["Toyota Hilux", "Isuzu FVR", "Nissan Hardbody", "Kia Frontier", "Land Cruiser"]
  const vehicleTypes = ["Truck", "Car", "Van", "Motorcycle", "SUV"]
  const usages = ["Delivery", "Transport", "Logistics", "Private", "Public"]

  const allVehicles: any[] = []
  let globalIndex = 1

  for (const user of users) {
    for (let i = 0; i < 20; i++) {
      const plateSuffix = String(globalIndex).padStart(4, "0")
      const plateNumber = `R${String.fromCharCode(65 + (globalIndex % 26))}D-${plateSuffix}`

      allVehicles.push({
        plateNumber,
        registrationNumber: `RW-VEH-${globalIndex.toString().padStart(4, "0")}`,
        chassisNumber: `CHS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        vehicleType: vehicleTypes[globalIndex % vehicleTypes.length],
        vehicleModel: vehicleModels[globalIndex % vehicleModels.length],
        yearOfManufacture: 2010 + (globalIndex % 15),
        usage: usages[globalIndex % usages.length],
        fuelType: fuelTypes[globalIndex % fuelTypes.length],
        status: statuses[globalIndex % statuses.length],
        emissionStatus: emissionStatuses[globalIndex % emissionStatuses.length] as any,
        lastMaintenanceDate: new Date(Date.now() - Math.random() * 1_000_000_000 * 2),
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      globalIndex++
    }
  }

  // Batch insert
  for (let i = 0; i < allVehicles.length; i += BATCH_SIZE) {
    const batch = allVehicles.slice(i, i + BATCH_SIZE)
    await prisma.vehicle.createMany({
      data: batch,
      skipDuplicates: true
    })
    console.log(`✅ Inserted ${Math.min(i + BATCH_SIZE, allVehicles.length)} / ${allVehicles.length} vehicles`)
  }

  console.log(`🎉 Finished seeding ${allVehicles.length} vehicles.`)
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
  