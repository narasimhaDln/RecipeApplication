import express from 'express';
import * as recipeController from '../controllers/recipe.controllers.js';
import authenticateToken from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: './Uploads/images/' });

// Prioritize specific routes over /:id to prevent routing conflicts
router.get('/search', recipeController.searchRecipes);
router.get('/favorites', authenticateToken, recipeController.getFavorites);
router.get('/recent', authenticateToken, recipeController.getRecentViews);
router.get(
  '/recommendations',
  authenticateToken,
  recipeController.getRecommendations,
);
router.get('/:id', authenticateToken, recipeController.getRecipe);
router.post('/favorites', authenticateToken, recipeController.addFavorite);
router.delete(
  '/favorites/:id',
  authenticateToken,
  recipeController.removeFavorite,
);
router.post(
  '/:id/image',
  authenticateToken,
  upload.single('image'),
  recipeController.uploadImage,
);

export default router;
