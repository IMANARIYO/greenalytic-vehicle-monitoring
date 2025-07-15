import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import MainRouter from './routes/allroutes';
import passport from './utils/passport';
import authRoutes from './routes/authRoutes';
import session from 'express-session';
import { globalErrorHandler, handleNotFoundRoutes } from './middlewares/errorHandler';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
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
app.use(authRoutes);
app.get('/', (req, res) => {
  res.send('API is running');
});
const PORT = Number(process.env.PORTT) || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});
