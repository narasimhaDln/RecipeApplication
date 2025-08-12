import db from '../config/db.config.js';

const addComment = (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  db.query(
    'INSERT INTO comments (user_id, recipe_id, comment, created_at) VALUES (?, ?, ?, NOW())',
    [req.user.id, id, comment],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Comment added' });
    },
  );
};

const getComments = (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.recipe_id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

const updateComment = (req, res) => {
  const { id, commentId } = req.params;
  const { comment } = req.body;
  db.query(
    'UPDATE comments SET comment = ? WHERE id = ? AND user_id = ? AND recipe_id = ?',
    [comment, commentId, req.user.id, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res
          .status(403)
          .json({ error: 'Not authorized to edit this comment' });
      res.json({ message: 'Comment updated' });
    },
  );
};

const deleteComment = (req, res) => {
  const { id, commentId } = req.params;
  db.query(
    'DELETE FROM comments WHERE id = ? AND user_id = ? AND recipe_id = ?',
    [commentId, req.user.id, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res
          .status(403)
          .json({ error: 'Not authorized to delete this comment' });
      res.json({ message: 'Comment deleted' });
    },
  );
};

export { addComment, getComments, updateComment, deleteComment };
