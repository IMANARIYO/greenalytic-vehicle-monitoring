# 🚗 Greenalytic Backend Implementation Guidelines

## Table of Contents
1. [Access Control & Protection](#access-control--protection)
2. [Clean Architecture Enforcement](#clean-architecture-enforcement)
3. [Consistent Error Handling & Logging](#consistent-error-handling--logging)
4. [Example Implementation Flow](#example-implementation-flow)
5. [Developer Task Assignment](#developer-task-assignment)
6. [Shared Development Standards](#shared-development-standards)
7. [Implementation Plan](#implementation-plan)

---

## 🔐 Access Control & Protection

All endpoints **must be protected** using the following middlewares:
- `isLoggedIn` – to ensure the user is authenticated
- `hasRole('ROLE_NAME')` – to enforce proper role-based access control (RBAC)

Apply them to routes where needed using Express middleware or TSOA route guards.

---

## 🧱 Clean Architecture Enforcement

### Follow the Controller → Service → Repository Pattern

1. **Controllers**:
   - Do **not** contain business logic
   - Only receive DTOs, call services, and return responses via `Response.success()` or `Response.error()`

2. **Services**:
   - Pure business logic goes here
   - Always return raw data (no Express `res`/`req` objects)
   - Handle all logic inside `try/catch`

3. **Repositories**:
   - All Prisma calls and database access
   - Encapsulate query logic (e.g., filtering, joins, aggregates)

---

## 🔄 Consistent Error Handling & Logging

### Wrap All Logic in `try/catch` Blocks

```typescript
try {
  const user = await this.userRepo.findByEmail(dto.email);
  if (!user) throw new Error("User not found");
  return user;
} catch (error) {
  logger.error("UserService::findUser", error);
  throw error;
}
```

---

## 📌 Example Implementation Flow

### 1. DTO: CreateUserRequest.ts
```typescript
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'TECHNICIAN';
}
```

### 2. Controller: UserController.ts
```typescript
import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest } from '../types/dtos/CreateUserRequest';
import ResponseHandler from '../utils/Response';

export class UserController {
  static async createUser(req: Request, res: Response) {
    try {
      const dto: CreateUserRequest = req.body;
      const user = await UserService.createUser(dto);
      return ResponseHandler.created(res, 'User created successfully', user);
    } catch (error) {
      return ResponseHandler.error(res, 'Failed to create user', error);
    }
  }
}
```

### 3. Service: UserService.ts
```typescript
import { CreateUserRequest } from '../types/dtos/CreateUserRequest';
import { UserRepository } from '../repositories/UserRepository';
import { passHashing } from '../utils/hash';
import logger from '../utils/logger';

export class UserService {
  static async createUser(dto: CreateUserRequest) {
    try {
      const existingUser = await UserRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const hashedPassword = await passHashing(dto.password);

      const user = await UserRepository.create({
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role: dto.role,
      });

      logger.info('UserService::createUser success', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('UserService::createUser failed', error);
      throw error;
    }
  }
}
```

### 4. Repository: UserRepository.ts
```typescript
import prisma from '../config/db';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

export class UserRepository {
  static async create(data: Prisma.UserCreateInput) {
    try {
      const user = await prisma.user.create({ data });
      logger.info('UserRepository::create user created', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('UserRepository::create failed', error);
      throw error;
    }
  }

  static async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      logger.error('UserRepository::findByEmail failed', error);
      throw error;
    }
  }
}
```

### 5. Validation Middleware: validateCreateUser.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateCreateUser = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['ADMIN', 'FLEET_MANAGER', 'TECHNICIAN']),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
```

### 6. Route Setup: UserRoutes.ts
```typescript
import express from 'express';
import { UserController } from '../controllers/UserController';
import { validateCreateUser } from '../middlewares/validateCreateUser';
import isLoggedIn from '../middlewares/isLoggedIn';
import hasRole from '../middlewares/hasRole';

const router = express.Router();

router.post(
  '/',
  isLoggedIn,
  hasRole('ADMIN'),
  validateCreateUser,
  UserController.createUser
);

export default router;
```

---

## 👥 Developer Task Assignment

### 📌 Module Overview
Real-time monitoring, analytics, and management of fleet vehicles and IoT tracking devices:
- Emission tracking (NOx, CO₂, PM2.5)
- GPS location & OBD-II monitoring
- Alerts, trends, historical data
- Device configuration, firmware management
- Role-based user access
- Report generation & exports

### 👤 Developer 1: IMANARIYO BAPTISTE – *Vehicle Management Lead*

#### 🔧 Vehicle Operations
- [ ✅] Create new vehicle (with validation)
- [ ✅] Update vehicle details
- [ ✅] Soft delete & restore vehicle
- [ ✅] Hard delete vehicle permanently
- [ ✅] Fetch vehicle by ID (include related stats)
- [ ✅] List all vehicles with:
  - Pagination
  - Search
  - Filter by status, category, etc.

#### 🔗 Assignment & Ownership
- [ ] Assign vehicle to Fleet Manager
- [ ] Reassign / Unassign vehicles

#### 📍 Live Monitoring & Telemetry
- [ ] Display vehicle on map (Google Maps)
- [ ] Show:
  - Real-time speed (km/h)
  - Fuel level
  - GPS location
  - Engine temperature
- [ ] Vehicle status indicator (Color‑coded):
  - 🟥 Red – Polluting
  - 🟩 Green – Normal
  - ⚫ Grey – Offline
  - 🟡 Yellow – Maintenance

#### 📊 Analytics & Trends
- [ ] Emission trends (Line graph)
- [ ] Speed variation over time
- [ ] Fuel usage logs
- [ ] Top 5 polluting vehicles
- [ ] Pie chart – Vehicles by type

#### ⚠️ Alerts & Notifications
- [ ] Emission threshold alert
- [ ] Speed limit violation alert
- [ ] Fuel consumption anomalies
- [ ] Predictive maintenance alert (trend‑based)

#### 📈 KPIs (Dashboard)
- [ ] Active vehicles count
- [ ] Faulty vehicles count
- [ ] Emission violators
- [ ] Top efficient vehicles

#### 🧾 Reports (Vehicle‑specific)
- [ ] Emission Trend Report
- [ ] Speed Violation Report
- [ ] Fuel Consumption Report
- [ ] Top Polluters Report
- [ ] **Export options:**
  - PDF
  - Excel
  - CSV

### 👤 Developer 2: SOSTEN – *Device Management Lead*

#### 🔧 Device Operations
- [ ] Register new device
- [ ] Update device info
- [ ] Soft delete / restore
- [ ] Hard delete
- [ ] Get device by ID
- [ ] List devices with pagination, filtering

#### 🔗 Assignment to Vehicle
- [ ] Assign device to vehicle
- [ ] Reassign / Unassign device
- [ ] Assign device to Fleet Manager (optional)

#### 📡 Device Status & Streaming
- [ ] Live Online/Offline indicator
- [ ] Show battery & signal strength
- [ ] Show assigned vehicle + last ping

#### ⚙️ Configuration & Control
- [ ] Update firmware
- [ ] Set data transmission interval
- [ ] Toggle:
  - GPS
  - OBD
  - Emission monitoring

#### 📊 Analytics & Stats
- [ ] Device category pie chart
- [ ] Device online/offline KPIs
- [ ] Connection history logs

#### ⚠️ Alerts & Notifications
- [ ] Offline device alerts
- [ ] No data ping
- [ ] OBD errors

#### 🧾 Reports (Device-specific)
- [ ] Connectivity Report
- [ ] Fault Summary
- [ ] Category Report
- [ ] Export: PDF / Excel / CSV

---

## ✅ Shared Development Standards

| Feature                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| Pagination & Filtering     | Every list endpoint must support pagination, search, and filtering          |
| Centralized Response       | Use global `Response.success()` and `Response.error()` wrappers              |
| Try/Catch in Services      | Handle all business logic errors using local try/catch blocks               |
| Time Range Filters         | Reports and history APIs must allow custom time filters (daily, weekly…)    |
| Export Metadata            | All exports must include generated-by, timestamp, and watermark             |
| Status Codes               | Use enums for status: ACTIVE, INACTIVE, OFFLINE, FAULTY                     |

---

## 📌 Implementation Plan

### ✅ Finish Core Features
- [x] CRUD: createVehicle, updateVehicle, softDelete, restore, deletePermanently
- [x] getVehicleById (with full nested relations)
- [x] listVehicles with filtering, pagination, sorting

### 🔗 Assignment Features
- [ ] Assign vehicle to Fleet Manager
- [ ] Reassign vehicle to another manager
- [ ] Unassign vehicle
- [ ] Validate `userId` is a Fleet Manager
- [ ] (Optional) Audit log for assignment changes

### 📈 KPI Summary (`getDashboardStats`)
- [ ] Count active vehicles
- [ ] Count faulty vehicles (from OBD)
- [ ] Count emission violators
- [ ] List top efficient vehicles

### 📊 Analytics & Trends
- [ ] Emission trends per vehicle (daily/weekly/monthly)
- [ ] Speed variation trends
- [ ] Fuel usage trends
- [ ] Pie chart: Vehicles by type/status
- [ ] Compare multiple vehicles side-by-side

### ⚠️ Alert Evaluation Service
- [ ] Detect emission threshold breaches
- [ ] Detect speed limit violations
- [ ] Detect fuel anomalies
- [ ] Detect OBD fault codes
- [ ] Detect offline devices
- [ ] Save alerts in DB
- [ ] Notify users via dashboard/email

### 📄 Report Generation with Export
- [ ] Emission Trend Report
- [ ] Speed Violation Report
- [ ] Fuel Consumption Report
- [ ] Top Polluters Report
- [ ] Export formats: PDF, Excel, CSV
- [ ] Time/date filters & vehicle filters

### 🗺️ Live Status Resolver (for Map View)
- [ ] Compute vehicle status color
- [ ] Provide live stats: speed, fuel, location, temp
- [ ] Use emissionStatus, obdData, connectionState
- [ ] Return live data object for frontend

### 🧪 Unit Testing
- [ ] VehicleRepository tests
- [ ] VehicleService tests
- [ ] Alert service tests
- [ ] Analytics service tests
- [ ] Report generation tests

---

## 📝 Development Notes

- Controller only handles request/response, no business logic
- Service holds business logic and validation, logs actions/errors
- Repository handles Prisma queries and logs errors
- Secures the route, validates input, then delegates to controller
- All endpoints must be protected with proper authentication and authorization
- Follow consistent naming conventions and error handling patterns
- Use TypeScript interfaces for strong typing
- Implement proper logging for debugging and monitoring