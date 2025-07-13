// DTO for creating new OBD data
export interface CreateOBDDataDTO {
  rpm?: number;
  throttlePosition: number;
  engineTemperature?: number;
  engineStatus?: string;
  faultCodes: string[];
  vehicleId: number;
  plateNumber: string;
  trackingDeviceId: number;
  timestamp?: Date;
}

// DTO for updating OBD data
export interface UpdateOBDDataDTO {
  rpm?: number;
  throttlePosition?: number;
  engineTemperature?: number;
  engineStatus?: string;
  faultCodes?: string[];
  plateNumber?: string;
  timestamp?: Date;
}

// DTO for querying OBD data with filters and pagination
export interface OBDDataQueryDTO {
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
  engineStatus?: string;
  hasFaultCodes?: boolean;
  
  // Engine parameter filtering
  minRPM?: number;
  maxRPM?: number;
  minEngineTemp?: number;
  maxEngineTemp?: number;
  minThrottlePosition?: number;
  maxThrottlePosition?: number;
  
  // Interval filtering (for getOBDDataByVehicleInterval)
  interval?: string; // 'hours', 'days', 'daytime'
  intervalValue?: string; // value for the interval
}

// Response DTO for OBD data with enhanced information
export interface OBDDataResponseDTO {
  id: number;
  timestamp: Date;
  rpm?: number | null;
  throttlePosition: number;
  engineTemperature?: number | null;
  engineStatus?: string | null;
  faultCodes: string[];
  plateNumber: string;
  vehicleId: number;
  trackingDeviceId: number;
  createdAt: Date;
  
  // Enhanced fields
  engineHealthStatus?: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  temperatureStatus?: 'NORMAL' | 'HIGH' | 'OVERHEATING';
  rpmStatus?: 'IDLE' | 'NORMAL' | 'HIGH' | 'REDLINE';
  throttleStatus?: 'CLOSED' | 'PARTIAL' | 'FULL';
  faultCodesCount?: number;
  hasActiveFaults?: boolean;
  performanceScore?: number; // 0-100 score
  
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

// DTO for OBD statistics response
export interface OBDStatisticsResponseDTO {
  data: {
    summary: {
      totalRecords: number;
      averageRPM: string;
      averageThrottlePosition: string;
      averageEngineTemperature: string;
      totalFaultCodes: number;
      vehiclesWithFaults: number;
      criticalEngineIssues: number;
    };
    engineAnalysis: {
      healthy: number;
      warning: number;
      critical: number;
      healthyPercentage: string;
      warningPercentage: string;
      criticalPercentage: string;
    };
    temperatureAnalysis: {
      normal: number;
      high: number;
      overheating: number;
      normalPercentage: string;
      highPercentage: string;
      overheatingPercentage: string;
    };
    rpmAnalysis: {
      idle: number;
      normal: number;
      high: number;
      redline: number;
      idlePercentage: string;
      normalPercentage: string;
      highPercentage: string;
      redlinePercentage: string;
    };
    faultCodeAnalysis: {
      mostCommonFaults: {
        [faultCode: string]: {
          count: number;
          description?: string;
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        };
      };
      faultTrends: {
        increasing: string[];
        decreasing: string[];
        stable: string[];
      };
    };
    performanceMetrics: {
      averagePerformanceScore: number;
      topPerformingVehicles: string[]; // plate numbers
      poorPerformingVehicles: string[]; // plate numbers
      maintenanceRequired: string[]; // plate numbers
    };
    thresholds: OBDThresholds;
    timeRange: {
      interval?: string;
      from?: string | Date;
      to?: string | Date;
    };
  };
}

// DTO for OBD data list response with pagination
export interface OBDDataListResponseDTO {
  data: OBDDataResponseDTO[];
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
        engineStatus?: string;
        hasFaultCodes?: boolean;
      };
      thresholds: OBDThresholds;
    };
  };
}

// DTO for vehicle OBD data response
export interface VehicleOBDDataResponseDTO {
  data: OBDDataResponseDTO[];
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
    vehicleHealth?: {
      overallScore: number;
      engineCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
      activeFaults: number;
      maintenanceRecommended: boolean;
      criticalIssues: string[];
    };
  };
}

// DTO for creating OBD data response with alerts
export interface CreateOBDDataResponseDTO {
  message: string;
  data: OBDDataResponseDTO;
  engineAlert: boolean;
  faultCodesDetected: boolean;
  alertsGenerated: number;
  alerts: {
    type: string;
    title: string;
    severity: 'WARNING' | 'CRITICAL';
  }[];
  diagnostics: {
    engineHealthScore: number;
    maintenanceRecommended: boolean;
    criticalFaults: string[];
    performanceTips: string[];
  };
}

// DTO for OBD diagnostic thresholds
export interface OBDThresholds {
  rpm: { idle: number; normal: number; high: number; critical: number };
  engineTemperature: { normal: number; high: number; critical: number }; // °C
  throttlePosition: { closed: number; partial: number; full: number }; // %
  faultCodes: { maxActive: number; warningLimit: number; criticalLimit: number };
  performance: { excellent: number; good: number; fair: number; poor: number }; // score
}

// DTO for OBD data with diagnostic analysis
export interface OBDDataWithDiagnosticsDTO extends OBDDataResponseDTO {
  diagnosticAnalysis: {
    engineHealth: {
      score: number; // 0-100
      status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
      issues: string[];
      recommendations: string[];
    };
    performanceMetrics: {
      rpmEfficiency: number;
      throttleResponse: number;
      temperatureStability: number;
      overallPerformance: number;
    };
    faultCodeDetails: {
      [faultCode: string]: {
        description: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        category: 'ENGINE' | 'TRANSMISSION' | 'EMISSIONS' | 'ELECTRICAL' | 'OTHER';
        recommendedAction: string;
      };
    };
    maintenancePrediction: {
      nextServiceDue: Date | null;
      urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      predictedIssues: string[];
      costEstimate?: number;
    };
  };
  thresholds: OBDThresholds;
}

// DTO for engine performance analysis
export interface EnginePerformanceAnalysisDTO {
  vehicleId: number;
  plateNumber: string;
  analysisperiod: {
    from: Date;
    to: Date;
    totalRecords: number;
  };
  performanceMetrics: {
    averageRPM: number;
    averageThrottlePosition: number;
    averageEngineTemperature: number;
    performanceScore: number;
    efficiencyRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  };
  trends: {
    rpmTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    temperatureTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    performanceTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  };
  faultHistory: {
    totalFaults: number;
    activeFaults: string[];
    resolvedFaults: string[];
    recurringFaults: string[];
  };
  recommendations: {
    immediate: string[];
    scheduled: string[];
    optimization: string[];
  };
}

// DTO for fault code analysis
export interface FaultCodeAnalysisDTO {
  summary: {
    totalFaultCodes: number;
    uniqueFaultCodes: number;
    criticalFaults: number;
    vehiclesAffected: number;
  };
  faultBreakdown: {
    [faultCode: string]: {
      occurrences: number;
      vehiclesAffected: string[]; // plate numbers
      firstSeen: Date;
      lastSeen: Date;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      category: 'ENGINE' | 'TRANSMISSION' | 'EMISSIONS' | 'ELECTRICAL' | 'OTHER';
      recommendedAction: string;
      averageResolutionTime?: number; // days
    };
  };
  trends: {
    emergingFaults: string[];
    decliningFaults: string[];
    persistentFaults: string[];
  };
  fleetHealth: {
    overallScore: number;
    healthyVehicles: number;
    vehiclesNeedingAttention: string[];
    maintenanceSchedule: {
      [plateNumber: string]: {
        urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        estimatedCost: number;
        recommendedDate: Date;
      };
    };
  };
}

// DTO for vehicle health monitoring
export interface VehicleHealthMonitoringDTO {
  vehicleId: number;
  plateNumber: string;
  currentStatus: {
    overallHealth: number; // 0-100 score
    engineCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    lastCheckup: Date;
    nextServiceDue: Date | null;
  };
  realtimeMetrics: {
    rpm: number | null;
    engineTemperature: number | null;
    throttlePosition: number;
    activeFaults: string[];
    warningIndicators: string[];
  };
  historicalTrends: {
    performanceDecline: boolean;
    temperatureIncrease: boolean;
    faultFrequencyIncrease: boolean;
    maintenanceOverdue: boolean;
  };
  alerts: {
    critical: string[];
    warnings: string[];
    notifications: string[];
  };
  recommendations: {
    immediate: string[];
    thisWeek: string[];
    thisMonth: string[];
    planned: string[];
  };
}