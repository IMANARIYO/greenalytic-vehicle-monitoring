import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';
import MainRouter from './routes/allroutes.js';
import passport from './utils/passport.js';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { globalErrorHandler, handleNotFoundRoutes } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', MainRouter);
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/docs', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'swagger.html'));
});
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



const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});

