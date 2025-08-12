import express from 'express';
import * as plannerController from '../controllers/planner.controllers.js';
import authenticateToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/add_recipe_to_meal_plan',
  authenticateToken,
  plannerController.addToPlan,
);
router.get('/get_meal_plan', authenticateToken, plannerController.getPlan);
router.put('/:id', authenticateToken, plannerController.updatePlan);
router.delete('/:id', authenticateToken, plannerController.removeFromPlan);

export default router;
