import express from 'express';
import * as userController from '../controllers/user.controllers.js';
import authenticateToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.post('/ingredients', authenticateToken, userController.addIngredients);
router.get('/ingredients', authenticateToken, userController.getIngredients);
router.put('/ingredients', authenticateToken, userController.updateIngredients);
router.get('/dashboard', authenticateToken, userController.getDashboard);

export default router;
