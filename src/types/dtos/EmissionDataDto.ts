// DTO for creating new emission data
export interface CreateEmissionDataDTO {
  co2Percentage: number;
  coPercentage: number;
  o2Percentage: number;
  hcPPM: number;
  noxPPM?: number;
  pm25Level?: number;
  vehicleId: number;
  plateNumber?: string;
  trackingDeviceId: number;
  timestamp?: Date;
}

// DTO for updating emission data
export interface UpdateEmissionDataDTO {
  co2Percentage?: number;
  coPercentage?: number;
  o2Percentage?: number;
  hcPPM?: number;
  noxPPM?: number;
  pm25Level?: number;
  vehicleId?: number;
  plateNumber?: string;
  trackingDeviceId?: number;
  timestamp?: Date;
  deletedAt?: Date;
}

// DTO for querying emission data with filters and pagination
export interface EmissionDataQueryDTO {
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
  emissionLevel?: string; // 'NORMAL', 'HIGH', 'CRITICAL'
  deviceCategory?: string;
  
  // Interval filtering (for getEmissionDataByVehicleInterval)
  interval?: string; // 'hours', 'days', 'daytime'
  intervalValue?: string; // value for the interval
}

// Response DTO for emission data with enhanced information
export interface EmissionDataResponseDTO {
  id: number;
  timestamp: Date;
  co2Percentage: number;
  coPercentage: number;
  o2Percentage: number;
  hcPPM: number;
  noxPPM?: number | null;
  pm25Level?: number | null;
  vehicleId: number;
  plateNumber?: string | null;
  trackingDeviceId: number;
  createdAt: Date;
  deletedAt?: Date | null;
  
  // Enhanced fields
  emissionLevel?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  exceedsThresholds?: {
    co2: boolean;
    co: boolean;
    hc: boolean;
    nox: boolean;
    pm25: boolean;
  };
  
  // Related data
  vehicle?: {
    plateNumber: string;
    vehicleModel: string;
    vehicleType: string;
    status: string;
    fuelType: string | null;
    user?: {
      username: string | null;
      companyName: string | null;
    };
  };
  
  trackingDevice?: {
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  };
}

// DTO for emission statistics response
export interface EmissionStatisticsResponseDTO {
  data: {
    averages: {
      co2: string;
      co: string;
      o2: string;
      hc: string;
      nox: string | null;
      pm25: string | null;
    };
    totals: {
      records: number;
      exceedsThresholds: number;
      exceedsPercentage: string;
    };
    thresholdAnalysis: {
      normal: number;
      high: number;
      critical: number;
      normalPercentage: string;
      highPercentage: string;
      criticalPercentage: string;
    };
    thresholds: EmissionThresholds;
    timeRange: {
      interval?: string;
      from?: string | Date;
      to?: string | Date;
    };
  };
}

// DTO for emission data list response with pagination
export interface EmissionDataListResponseDTO {
  data: EmissionDataResponseDTO[];
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
        emissionLevel?: string;
        deviceCategory?: string;
      };
      thresholds: EmissionThresholds;
    };
  };
}

// DTO for vehicle emission data response
export interface VehicleEmissionDataResponseDTO {
  data: EmissionDataResponseDTO[];
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
  };
}

// DTO for creating emission data response with alerts
export interface CreateEmissionDataResponseDTO {
  message: string;
  data: EmissionDataResponseDTO;
  vehicleStatus: string;
  alertsGenerated: number;
  alerts: {
    type: string;
    title: string;
    severity: 'WARNING' | 'CRITICAL';
  }[];
}

// DTO for emission thresholds
export interface EmissionThresholds {
  co2: { warning: number; critical: number };
  co: { warning: number; critical: number };
  hc: { warning: number; critical: number };
  nox: { warning: number; critical: number };
  pm25: { warning: number; critical: number };
}

// DTO for emission data with threshold analysis
export interface EmissionDataWithAnalysisDTO extends EmissionDataResponseDTO {
  thresholdAnalysis: {
    co2: {
      value: number;
      exceedsWarning: boolean;
      exceedsCritical: boolean;
    };
    co: {
      value: number;
      exceedsWarning: boolean;
      exceedsCritical: boolean;
    };
    hc: {
      value: number;
      exceedsWarning: boolean;
      exceedsCritical: boolean;
    };
    nox?: {
      value: number;
      exceedsWarning: boolean;
      exceedsCritical: boolean;
    };
    pm25?: {
      value: number;
      exceedsWarning: boolean;
      exceedsCritical: boolean;
    };
  };
  thresholds: EmissionThresholds;
}