import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import MainRouter from './routes/allroutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// Swagger UI at /api-docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', MainRouter);
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});

