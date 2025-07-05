import { TrackingDevice, DeviceCategory, DeviceStatus } from '@prisma/client';

import vehicleRepository from '../repositories/VehicleRepository';
import { AppError } from '../middlewares/errorHandler';
import TrackingDeviceRepository from '../repositories/TrackingDeviceRepository';


export class TrackingDeviceService {
  static async addTrackingDeviceToVehicle(data: TrackingDevice): Promise<TrackingDevice> {
    const { serialNumber, model, type, vehicleId } = data;

    if (!serialNumber || !model || !type || !vehicleId) {
      throw new AppError("Missing required tracking device information", 400);
    }

    // 🔁 Convert string 'type' to DeviceCategory enum
    const upperType = type.toUpperCase() as keyof typeof DeviceCategory;

    if (!DeviceCategory[upperType]) {
      throw new AppError(`Invalid device category: ${type}`, 400);
    }

    const deviceCategory = DeviceCategory[upperType];

    // 1. ✅ Ensure the vehicle exists
    const vehicle = await vehicleRepository.getVehicleById(vehicleId);
    if (!vehicle) {
      throw new AppError("Vehicle does not exist", 404);
    }

    // 2. ✅ Check if device with same serial already exists
    const existingDevice = await TrackingDeviceRepository.findBySerialNumber(serialNumber);
    if (existingDevice) {
      if (existingDevice.vehicleId) {
        throw new AppError("This device is already assigned to a vehicle", 409);
      }
      throw new AppError("Tracking device with this serial number already exists", 409);
    }

    // 3. ✅ Check for category conflict on the same vehicle
    const categoryConflict = await TrackingDeviceRepository.findDeviceCategoryConflict(vehicleId, deviceCategory);
    if (categoryConflict) {
      throw new AppError(`A ${type} device is already assigned to this vehicle`, 409);
    }

    // 4. ✅ Create new device with full vehicle data
    const trackingDevice = await TrackingDeviceRepository.createTrackingDevice({
      serialNumber,
      model,
      type,
      deviceCategory,
      plateNumber: vehicle.plateNumber,
      vehicle: {
        connect: { id: vehicle.id }
      },
    
      user: {
        connect: { id: vehicle.user.id }
      },
    
      isActive: true,
      status: DeviceStatus.ACTIVE,
      lastPing: new Date(),
      installationDate: new Date(),
      communicationProtocol: 'MQTT',
    });

    return trackingDevice;
  }
}
