import db from '../config/db.config.js';

const addRating = (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;
  if (rating < 1 || rating > 5)
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });

  const query =
    'INSERT INTO ratings (user_id, recipe_id, rating, review, created_at) VALUES (?, ?, ?, ?, NOW())';
  db.query(query, [req.user.id, id, rating, review], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Rating submitted' });
  });
};

const getRatings = (req, res) => {
  const { id } = req.params;
  const query =
    'SELECT r.*, u.username FROM ratings r JOIN users u ON r.user_id = u.id WHERE r.recipe_id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const averageRating = results.length
      ? (
          results.reduce((sum, r) => sum + r.rating, 0) / results.length
        ).toFixed(1)
      : 0;

    res.json({ ratings: results, averageRating });
  });
};

export { addRating, getRatings };
