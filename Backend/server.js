// Backend/server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
// Load environment variables
dotenv.config();
import './config/db.config.js';
// Import routes
import userRoutes from './routes/user.routes.js';
import recipeRoutes from './routes/recipe.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import shoppingRoutes from './routes/shapping.routes.js';
import plannerRoutes from './routes/planner.routes.js';
import commentRoutes from './routes/commet.routes.js';

const app = express();
const port = process.env.PORT || 5000;

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/recipes', ratingRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/recipes', commentRoutes);

// Serve frontend (static HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '../frontend')));

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
