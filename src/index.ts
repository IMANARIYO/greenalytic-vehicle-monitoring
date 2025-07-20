import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';
import MainRouter from './routes/allroutes.js';

import passport from './utils/passport.js';
import session from 'express-session';
import { globalErrorHandler, handleNotFoundRoutes } from './middlewares/errorHandler.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
    // "build": "tsc && tsc-alias && npm run copy-yaml",
// Swagger UI at /api-docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', MainRouter);
app.use(handleNotFoundRoutes);
app.use(globalErrorHandler);
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});

