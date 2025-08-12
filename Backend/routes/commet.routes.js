import express from 'express';
import * as commentController from '../controllers/comment.controllers.js';
import authenticateToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/:id/comments', authenticateToken, commentController.addComment);
router.get('/:id/comments', commentController.getComments);
router.put(
  '/:id/comments/:commentId',
  authenticateToken,
  commentController.updateComment,
);
router.delete(
  '/:id/comments/:commentId',
  authenticateToken,
  commentController.deleteComment,
);

export default router;
