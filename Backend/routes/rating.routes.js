import express from 'express';
import * as ratingController from '../controllers/rating.controllers.js';
import authenticateToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/:id/ratings', authenticateToken, ratingController.addRating);
router.get('/:id/ratings', ratingController.getRatings);

export default router;
