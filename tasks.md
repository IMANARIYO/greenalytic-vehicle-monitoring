# ✅ Greenalytic Backend Implementation Guidelines

## 🔐 Access Control & Protection
- ✅ All endpoints **must be protected** using the following middlewares:
  - `isLoggedIn` – to ensure the user is authenticated.
  - `hasRole('ROLE_NAME')` – to enforce proper role-based access control (RBAC).
- Apply them to routes where needed using Express middleware or TSOA route guards.

---

## 🧱 Clean Architecture Enforcement

### ✅ Follow the Controller → Service → Repository Pattern

1. **Controllers**:
   - Do not contain business logic.
   - Only receive DTOs, call services, and return responses via `Response.success()` or `Response.error()`.

2. **Services**:
   - Pure business logic goes here.
   - Always return raw data (no Express `res`/`req` objects).
   - Handle all logic inside `try/catch`.

3. **Repositories**:
   - All Prisma calls and database access.
   - Encapsulate query logic (e.g., filtering, joins, aggregates).

---

## 🔄 Consistent Error Handling & Logging

### Wrap All Logic in `try/catch` Blocks

- ✅ Example:

```ts
try {
  const user = await this.userRepo.findByEmail(dto.email);
  if (!user) throw new Error("User not found");
  return user;
} catch (error) {
  logger.error("UserService::findUser", error);
  throw error;
}




# 🚗 Greenalytic Vehicle Monitoring – Developer Task Assignment

> A role-based breakdown of development responsibilities for **Vehicle** and **Device** management modules.

---

## 📌 Module Overview

This project enables **real-time monitoring**, **analytics**, and **management** of fleet vehicles and IoT tracking devices. The platform features:
- Emission tracking (NOx, CO₂, PM2.5)
- GPS location & OBD-II monitoring
- Alerts, trends, historical data
- Device configuration, firmware management
- Role-based user access
- Report generation & exports

---

## 👤 Developer 1: IMANARIYO BAPTISTE – `Vehicle Management Lead`

### 🔧 Vehicle Operations
- [ ] Create new vehicle (with validation)
- [ ] Update vehicle details
- [ ] Soft delete & restore vehicle
- [ ] Hard delete vehicle permanently
- [ ] Fetch vehicle by ID (include related stats)
- [ ] List all vehicles with:
  - Pagination
  - Search
  - Filter by status, category, etc.

### 🔗 Assignment & Ownership
- [ ] Assign vehicle to Fleet Manager
- [ ] Reassign / Unassign vehicles

### 📍 Live Monitoring & Telemetry
- [ ] Display vehicle on map (Google Maps)
- [ ] Show:
  - Real-time speed (km/h)
  - Fuel level
  - GPS location
  - Engine temperature
- [ ] Vehicle status indicator (Color-coded):
  - 🟥 Red – Polluting
  - 🟩 Green – Normal
  - ⚫ Grey – Offline
  - 🟡 Yellow – Maintenance

### 📊 Analytics & Trends
- [ ] Emission trends (Line graph)
- [ ] Speed variation over time
- [ ] Fuel usage logs
- [ ] Top 5 polluting vehicles
- [ ] Pie chart – Vehicles by type

### ⚠️ Alerts & Notifications
- [ ] Emission threshold alert
- [ ] Speed limit violation alert
- [ ] Fuel consumption anomalies
- [ ] Predictive maintenance alert (trend-based)

### 📈 KPIs (Dashboard)
- [ ] Active vehicles count
- [ ] Faulty vehicles count
- [ ] Emission violators
- [ ] Top efficient vehicles

### 🧾 Reports (Vehicle-specific)
- [ ] Emission Trend Report
- [ ] Speed Violation Report
- [ ] Fuel Consumption Report
- [ ] Top Polluters Report
- [ ] Export options:
  - PDF
  - Excel
  - CSV

---

## 👤 Developer 2: SOSTEN – `Device Management Lead`

### 🔧 Device Operations
- [ ] Register new device
  - Serial number
  - Firmware version
  - SIM card
  - Installation date
- [ ] Update device info
- [ ] Soft delete / restore
- [ ] Hard delete
- [ ] Get device by ID
- [ ] List devices with:
  - Pagination
  - Search
  - Filter by status, category

### 🔗 Assignment to Vehicle
- [ ] Assign device to vehicle
- [ ] Reassign / Unassign device
- [ ] Optionally assign to Fleet Manager

### 📡 Device Status & Streaming
- [ ] Live Online/Offline indicator
- [ ] Last ping time
- [ ] Show battery & signal strength
- [ ] Show assigned vehicle

### ⚙️ Configuration & Control
- [ ] Update firmware version
- [ ] Set transmission interval
- [ ] Enable/Disable:
  - GPS
  - OBD monitoring
  - Emission tracking

### 📊 Analytics & Stats
- [ ] Pie chart – Device categories (Car, Motorcycle, Truck)
- [ ] Device status KPI (Online, Offline, Faulty)
- [ ] Device connection history (timeline)

### ⚠️ Alerts & Notifications
- [ ] Offline device alerts
- [ ] No data ping alert
- [ ] OBD-related device alerts

### 🧾 Reports (Device-specific)
- [ ] Device Connectivity Report
- [ ] Faulty Device Summary
- [ ] Device Category Distribution
- [ ] Export formats:
  - PDF
  - Excel
  - CSV

---

## 🔁 Shared Development Standards

| Feature                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| Pagination & Filtering     | Every list endpoint must support pagination, search, and filtering          |
| Centralized Response       | Use global `Response.success()` and `Response.error()` wrappers              |
| Try/Catch in Services      | Handle all business logic errors using local try/catch blocks               |
| Time Range Filters         | Reports and history APIs must allow custom time filters (daily, weekly…)    |
| Export Metadata            | All exports must include generated-by, timestamp, and watermark             |
| Status Codes               | Use enums for status: ACTIVE, INACTIVE, OFFLINE, FAULTY                     |

---

## 📁 Folder Guidelines

Structure your files under:


---

## ✅ What’s Next?

- Each developer sets up their module folder.
- Create Swagger DTOs using TSOA decorators.
- Implement endpoints one-by-one with:
  - DTOs → Service → Repo → Controller
- Start from `POST`, then `GET`, then reports, then exports.

---

> If you need this in PDF format, just export it from this markdown using VSCode, Obsidian, or online markdown-to-pdf tools.
