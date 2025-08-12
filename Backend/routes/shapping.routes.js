import express from 'express';
import * as shoppingController from '../controllers/shappig.controllers.js';
import authenticateToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/list',
  authenticateToken,
  shoppingController.generateShoppingList,
);
router.get('/list', authenticateToken, shoppingController.getShoppingList);
router.put('/list', authenticateToken, shoppingController.updateShoppingList);
router.delete('/list', authenticateToken, shoppingController.clearShoppingList);

// Individual item operations
router.put(
  '/list/:id',
  authenticateToken,
  shoppingController.updateShoppingItem,
);
router.delete(
  '/list/:id',
  authenticateToken,
  shoppingController.deleteShoppingItem,
);

export default router;
