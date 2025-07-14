// DTO for creating new fuel data
export interface CreateFuelDataDTO {
  fuelLevel: number;
  fuelConsumption: number;
  vehicleId: number;
  plateNumber: string;
  trackingDeviceId: number;
  timestamp?: Date;
}

// DTO for updating fuel data
export interface UpdateFuelDataDTO {
  fuelLevel?: number;
  fuelConsumption?: number;
  plateNumber?: string;
  timestamp?: Date;
}

// DTO for querying fuel data with filters and pagination
export interface FuelDataQueryDTO {
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
  fuelLevel?: string; // 'LOW', 'NORMAL', 'HIGH'
  consumptionLevel?: string; // 'EFFICIENT', 'NORMAL', 'POOR'
  minConsumption?: number;
  maxConsumption?: number;
  minFuelLevel?: number;
  maxFuelLevel?: number;
  fuelType?: string;
  
  // Interval filtering (for getFuelDataByVehicleInterval)
  interval?: string; // 'hours', 'days', 'daytime'
  intervalValue?: string; // value for the interval
}

// Response DTO for fuel data with enhanced information
export interface FuelDataResponseDTO {
  id: number;
  timestamp: Date;
  fuelLevel: number;
  fuelConsumption: number;
  plateNumber: string;
  vehicleId: number;
  trackingDeviceId: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced fields
  fuelLevelStatus?: 'LOW' | 'NORMAL' | 'HIGH';
  consumptionStatus?: 'EFFICIENT' | 'NORMAL' | 'POOR';
  fuelEfficiency?: number; // km/L calculated
  estimatedRange?: number; // Estimated range in km
  costEstimate?: number; // Estimated fuel cost
  
  // Related data
  vehicle?: {
    plateNumber: string;
    vehicleModel: string;
    vehicleType: string;
    fuelType: string | null;
    status: string;
  };
  
  trackingDevice?: {
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  };
}

// DTO for fuel statistics response
export interface FuelStatisticsResponseDTO {
  data: {
    summary: {
      totalRecords: number;
      averageFuelLevel: string;
      averageConsumption: string;
      totalConsumption: string;
      estimatedTotalCost: string;
      highConsumptionCount: number;
      lowFuelLevelCount: number;
    };
    consumptionAnalysis: {
      efficient: number;
      normal: number;
      poor: number;
      efficientPercentage: string;
      normalPercentage: string;
      poorPercentage: string;
    };
    fuelLevelAnalysis: {
      low: number;
      normal: number;
      high: number;
      lowPercentage: string;
      normalPercentage: string;
      highPercentage: string;
    };
    trends: {
      consumptionTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
      fuelLevelTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
      efficiencyTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    };
    thresholds: FuelConsumptionThresholds;
    timeRange: {
      interval?: string;
      from?: string | Date;
      to?: string | Date;
    };
  };
}

// DTO for fuel data list response with pagination
export interface FuelDataListResponseDTO {
  data: FuelDataResponseDTO[];
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
        fuelLevel?: string;
        consumptionLevel?: string;
      };
      thresholds: FuelConsumptionThresholds;
    };
  };
}

// DTO for vehicle fuel data response
export interface VehicleFuelDataResponseDTO {
  data: FuelDataResponseDTO[];
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
    fuelSummary?: {
      totalConsumption: number;
      averageConsumption: number;
      averageFuelLevel: number;
      estimatedCost: number;
      refuelingSuggested: boolean;
    };
  };
}

// DTO for creating fuel data response with alerts
export interface CreateFuelDataResponseDTO {
  message: string;
  data: FuelDataResponseDTO;
  lowFuelAlert: boolean;
  highConsumptionAlert: boolean;
  alertsGenerated: number;
  alerts: {
    type: string;
    title: string;
    severity: 'WARNING' | 'CRITICAL';
  }[];
  recommendations: {
    refuelingSuggested?: boolean;
    maintenanceRecommended?: boolean;
    efficiencyTips?: string[];
  };
}

// DTO for fuel consumption thresholds
export interface FuelConsumptionThresholds {
  consumption: { warning: number; critical: number }; // L/100km
  level: { low: number; critical: number }; // Fuel level percentage
  efficiency: { poor: number; excellent: number }; // km/L
  cost: { budget: number; high: number }; // Cost per 100km
}

// DTO for fuel data with efficiency analysis
export interface FuelDataWithEfficiencyDTO extends FuelDataResponseDTO {
  efficiencyAnalysis: {
    currentEfficiency: number; // km/L
    benchmarkEfficiency: number; // Average for vehicle type
    efficiencyRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    potentialSavings: number; // Potential cost savings
    improvementSuggestions: string[];
  };
  costAnalysis: {
    currentCost: number; // Cost per 100km
    benchmarkCost: number; // Average cost for vehicle type
    monthlyCostEstimate: number;
    annualCostEstimate: number;
  };
  thresholds: FuelConsumptionThresholds;
}

// DTO for consumption range query response
export interface ConsumptionRangeResponseDTO {
  data: FuelDataResponseDTO[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    consumptionRange: {
      minConsumption: number;
      maxConsumption: number;
      averageConsumption: number;
      totalConsumption: number;
      inefficientRecords: number;
    };
  };
}

// DTO for fuel efficiency analysis response
export interface FuelEfficiencyAnalysisDTO {
  data: FuelDataResponseDTO[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    efficiencyAnalysis: {
      overallEfficiency: number; // km/L
      fuelTypeAnalysis: {
        [fuelType: string]: {
          averageEfficiency: number;
          recordCount: number;
          costPerKm: number;
        };
      };
      vehicleTypeAnalysis: {
        [vehicleType: string]: {
          averageEfficiency: number;
          recordCount: number;
          bestPerformer: string; // plate number
          worstPerformer: string; // plate number
        };
      };
      recommendations: {
        mostEfficientVehicles: string[]; // plate numbers
        leastEfficientVehicles: string[]; // plate numbers
        maintenanceRecommended: string[]; // plate numbers
        replacementSuggested: string[]; // plate numbers
      };
    };
  };
}

// DTO for fuel level monitoring
export interface FuelLevelMonitoringDTO {
  vehicleId: number;
  plateNumber: string;
  currentFuelLevel: number;
  fuelCapacity: number; // Tank capacity in liters
  estimatedRange: number; // Remaining range in km
  lastRefuel?: {
    timestamp: Date;
    amount: number;
    cost: number;
  };
  refuelRecommendation: {
    suggested: boolean;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    nearestStations?: {
      name: string;
      distance: number;
      estimatedPrice: number;
    }[];
  };
}

// DTO for fuel cost analysis
export interface FuelCostAnalysisDTO {
  period: {
    from: Date;
    to: Date;
  };
  totalCost: number;
  averageDailyCost: number;
  averageMonthlyCost: number;
  fuelPriceUsed: number; // Price per liter
  costBreakdown: {
    byVehicle: {
      [plateNumber: string]: {
        totalConsumption: number;
        totalCost: number;
        efficiency: number;
      };
    };
    byFuelType: {
      [fuelType: string]: {
        totalConsumption: number;
        totalCost: number;
        vehicleCount: number;
      };
    };
  };
  budgetComparison?: {
    budgetLimit: number;
    actualSpent: number;
    variance: number;
    variancePercentage: number;
  };
}