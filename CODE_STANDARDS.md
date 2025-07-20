# General Code Standards & System Structure Guidelines

## 1. Project Structure
- Follow a modular and layered architecture (e.g., controllers, services, repositories).
- Separate concerns clearly:
  - **Controllers** handle HTTP requests/responses.
  - **Services** contain business logic.
  - **Repositories/Database Layer** interact with Prisma and the database.
- Use consistent and meaningful folder/file naming conventions.
- Keep each file focused and under 200 lines if possible.
- Organize reusable utilities and types in dedicated folders (`/utils`, `/types`).
## 2. Naming Conventions
- **Files and Folders:**
  - Use **kebab-case** for folder and file names (e.g., `user-controller.ts`, `auth-service.ts`).
- **Classes and Interfaces:**
  - Use **PascalCase** (e.g., `UserController`, `Response`, `UserService`).
- **Functions and Variables:**
  - Use **camelCase** (e.g., `getUserById`, `userService`, `isAuthenticated`).
- **Constants and Enums:**
  - Use **UPPER_SNAKE_CASE** (e.g., `USER_ROLE_ADMIN`, `FEEDBACK_STATUS_PENDING`).
- **Types and Interfaces:**
  - Prefix interfaces with `I` only if it improves clarity (optional). Otherwise, use PascalCase (e.g., `User`, `CreateUserDto`).
- **API Endpoints:**
  - Use plural nouns and kebab-case (e.g., `/api/users`, `/api/vehicle-status`).
## 3. Code Quality Standards
- Write clean, readable, and maintainable code.
- Use TypeScript with strict typing to catch errors early.
- Follow DRY (Don’t Repeat Yourself) principle.
- Use async/await for asynchronous code; avoid mixing callbacks/promises unnecessarily.
- Handle errors gracefully with centralized error handling middleware.
- Validate and sanitize all user inputs to prevent security vulnerabilities.
- Use environment variables for secrets and configuration; never hardcode sensitive info.
- Write unit and integration tests for critical logic and API endpoints.
- Use linting and formatting tools (e.g., ESLint + Prettier) to enforce consistent style.
- Keep commits small and descriptive with clear messages.

---

### ⚠️ **Important: Always use the centralized `Response` class for ALL API responses!** ⚠️

This ensures **consistent response structure** across the entire project:

```ts
// Example usage in controllers
import Response from '../utils/response.js';

class UserController {
  static async getUser(req, res) {
    try {
      const user = await userService.findUserById(req.params.id);
      return Response.success(res, user, 'User fetched successfully');
    } catch (error) {
      return Response.error(res, error, 'Failed to fetch user');
    }
  }
}

## 4. Logging and Monitoring
- Implement structured logging with appropriate log levels (info, warn, error).
- Log errors with enough context to debug without exposing sensitive data.
- Use log rotation or external logging services for production environments.

## 4. Authentication & Security
- Use bcrypt to securely hash passwords.
- Use JWT tokens for stateless authentication; implement proper token expiration.
- Validate all JWT tokens on protected routes.
- Enforce role-based access control (RBAC).
- Use HTTPS in production.
- Avoid exposing internal errors or stack traces in API responses.

## 5. API Design & Documentation
- Follow RESTful API principles.
- Use OpenAPI (Swagger) to auto-generate API documentation.
- Keep API responses consistent in format and structure.
- Handle and return proper HTTP status codes.
- Validate requests and return clear error messages.

## 6. Database & Prisma Usage
- Use Prisma’s type-safe queries.
- Apply cascading deletes carefully to maintain referential integrity.
- Avoid raw queries unless necessary.
- Use transactions for multi-step operations to maintain data consistency.

## 7. Testing
- Write tests for all service methods and API endpoints.
- Use mocking for external dependencies (e.g., database, third-party APIs).
- Run tests automatically in CI/CD pipelines.
- Aim for good coverage but focus on critical paths and edge cases.

## 8. Continuous Integration & Deployment (CI/CD)
- Use CI pipelines to run linting, tests, and build on each push.
- Automate deployment with proper environment separation (dev, staging, production).
- Use feature branches and pull requests for code review.

## 9. Version Control
- Follow Git best practices: commit often, write clear commit messages.
- Use `.gitignore` to exclude sensitive files (e.g., `.env`).
- Use branches and pull requests for all changes.
- Tag releases and maintain changelogs.

## 10. Documentation
- Document functions, classes, and modules with JSDoc/TSDoc style comments.
- Maintain up-to-date README and API docs.
- Include setup, build, testing, and deployment instructions.

---

If your team follows these guidelines, the project will be:

- More maintainable  
- Secure and robust  
- Easier to onboard new developers  
- Ready for scaling and production  
