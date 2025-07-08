// DTO for creating new GPS data
export interface CreateGpsDataDTO {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy?: number;
  vehicleId: number;
  plateNumber: string;
  trackingDeviceId?: number;
  trackingStatus?: boolean;
  timestamp?: Date;
}

// DTO for updating GPS data
export interface UpdateGpsDataDTO {
  latitude?: number;
  longitude?: number;
  speed?: number;
  accuracy?: number;
  plateNumber?: string;
  trackingStatus?: boolean;
  timestamp?: Date;
  deletedAt?: Date;
}

// DTO for querying GPS data with filters and pagination
export interface GpsDataQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  vehicleId?: number;
  plateNumber?: string;
  trackingDeviceId?: number;
  
  // Date filtering
  startTime?: Date;
  endTime?: Date;
  
  // Advanced filtering
  vehicleStatus?: string;
  speedLevel?: string; // 'NORMAL', 'HIGH', 'CRITICAL'
  minSpeed?: number;
  maxSpeed?: number;
  
  // Location filtering
  centerLatitude?: number;
  centerLongitude?: number;
  radiusKm?: number;
  
  // Interval filtering (for getGpsDataByVehicleInterval)
  interval?: string; // 'hours', 'days', 'daytime'
  intervalValue?: string; // value for the interval
}

// Response DTO for GPS data with enhanced information
export interface GpsDataResponseDTO {
  id: number;
  latitude: number;
  longitude: number;
  speed: number;
  accuracy?: number | null;
  plateNumber: string;
  vehicleId: number;
  trackingDeviceId?: number | null;
  trackingStatus: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced fields
  speedLevel?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  exceedsSpeedLimit?: boolean;
  distanceFromPrevious?: number; // Distance in km from previous GPS point
  
  // Related data
  vehicle?: {
    plateNumber: string;
    vehicleModel: string;
    vehicleType: string;
    status: string;
    fuelType: string | null;
  };
  
  trackingDevice?: {
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  };
}

// DTO for GPS statistics response
export interface GpsStatisticsResponseDTO {
  data: {
    summary: {
      totalRecords: number;
      totalDistanceKm: number;
      averageSpeed: string;
      maxSpeed: number;
      speedViolations: number;
      speedViolationPercentage: string;
    };
    speedAnalysis: {
      normal: number;
      high: number;
      critical: number;
      normalPercentage: string;
      highPercentage: string;
      criticalPercentage: string;
    };
    locationCoverage: {
      minLatitude: number;
      maxLatitude: number;
      minLongitude: number;
      maxLongitude: number;
      boundingBoxArea: number; // Area in square km
    };
    thresholds: SpeedThresholds;
    timeRange: {
      interval?: string;
      from?: string | Date;
      to?: string | Date;
    };
  };
}

// DTO for GPS data list response with pagination
export interface GpsDataListResponseDTO {
  data: GpsDataResponseDTO[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    filters?: {
      applied: {
        vehicleStatus?: string;
        speedLevel?: string;
        locationRadius?: string;
      };
      thresholds: SpeedThresholds;
    };
  };
}

// DTO for vehicle GPS data response
export interface VehicleGpsDataResponseDTO {
  data: GpsDataResponseDTO[];
  meta: {
    currentPage: number;
    totalPages: number;
    remainingItems: number;
    totalItems: number;
    limit: number;
    interval?: string;
    value?: string;
    timeRange?: {
      from: Date;
      to?: Date;
    };
    route?: {
      totalDistanceKm: number;
      averageSpeed: number;
      maxSpeed: number;
      duration: string; // Duration in format "2h 30m"
    };
  };
}

// DTO for creating GPS data response with alerts
export interface CreateGpsDataResponseDTO {
  message: string;
  data: GpsDataResponseDTO;
  speedViolation: boolean;
  alertsGenerated: number;
  alerts: {
    type: string;
    title: string;
    severity: 'WARNING' | 'CRITICAL';
  }[];
  location: {
    address?: string; // Reverse geocoded address if available
    city?: string;
    country?: string;
  };
}

// DTO for speed thresholds
export interface SpeedThresholds {
  speed: { warning: number; critical: number };
  accuracy: { minimum: number };
  tracking: { interval: number };
}

// DTO for GPS data with route analysis
export interface GpsDataWithRouteAnalysisDTO extends GpsDataResponseDTO {
  routeAnalysis: {
    distanceFromStart: number; // Distance in km from route start
    timeFromStart: string; // Time elapsed from route start
    bearing: number; // Direction in degrees (0-360)
    speedChange: number; // Speed change from previous point
    isStationary: boolean; // True if speed < 5 km/h
    estimatedAddress?: string; // Reverse geocoded address
  };
  thresholds: SpeedThresholds;
}

// DTO for location radius query response
export interface LocationRadiusResponseDTO {
  data: GpsDataResponseDTO[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    searchRadius: {
      centerLatitude: number;
      centerLongitude: number;
      radiusKm: number;
      searchAreaKm2: number;
    };
  };
}

// DTO for speed range query response
export interface SpeedRangeResponseDTO {
  data: GpsDataResponseDTO[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    speedRange: {
      minSpeed: number;
      maxSpeed: number;
      averageSpeed: number;
      violationsFound: number;
    };
  };
}