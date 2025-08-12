import db from '../config/db.config.js';
import axios from 'axios';
import cache from '../cache/recipe.cache.js';
import dotenv from 'dotenv';
dotenv.config();

export const generateShoppingList = async (req, res) => {
  const { recipeIds } = req.body;
  const userId = req.user.id;

  // Validate recipeIds
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res
      .status(400)
      .json({ error: 'recipeIds must be a non-empty array' });
  }

  let ingredients = [];
  for (const recipeId of recipeIds) {
    const cacheKey = `recipe_${recipeId}`;
    let recipe = cache.get(cacheKey);
    if (!recipe) {
      try {
        const response = await axios.get(
          `https://api.spoonacular.com/recipes/${recipeId}/information`,
          {
            params: { apiKey: process.env.SPOONACULAR_API_KEY },
          },
        );
        recipe = response.data;
        cache.set(cacheKey, recipe);
      } catch (apiError) {
        console.error(
          `Failed to fetch recipe ${recipeId}:`,
          apiError.response?.status,
          apiError.message,
        );
        continue; // Skip invalid recipeId
      }
    }
    ingredients = [
      ...ingredients,
      ...recipe.extendedIngredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })),
    ];
  }

  if (ingredients.length === 0) {
    return res
      .status(400)
      .json({ error: 'No valid recipes found for the provided recipeIds' });
  }

  db.query(
    'INSERT INTO shopping_list (user_id, ingredient_name, amount, unit, category) VALUES ?',
    [
      ingredients.map((ing) => [
        userId,
        ing.name,
        ing.amount,
        ing.unit,
        'Other',
      ]),
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Shopping list generated', ingredients });
    },
  );
};

export const getShoppingList = (req, res) => {
  db.query(
    'SELECT * FROM shopping_list WHERE user_id = ?',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

export const updateShoppingList = (req, res) => {
  const { items } = req.body;
  const promises = items.map(
    (item) =>
      new Promise((resolve, reject) => {
        db.query(
          'UPDATE shopping_list SET purchased = ? WHERE id = ? AND user_id = ?',
          [item.purchased, item.id, req.user.id],
          (err) => {
            if (err) reject(err);
            resolve();
          },
        );
      }),
  );
  Promise.all(promises)
    .then(() => res.json({ message: 'Shopping list updated' }))
    .catch((err) => res.status(500).json({ error: err.message }));
};

export const clearShoppingList = (req, res) => {
  db.query(
    'DELETE FROM shopping_list WHERE user_id = ?',
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Shopping list cleared' });
    },
  );
};

export const updateShoppingItem = (req, res) => {
  const { id } = req.params;
  const { purchased, ingredient_name, category } = req.body;
  const userId = req.user.id;

  let query = 'UPDATE shopping_list SET ';
  let params = [];
  let updates = [];

  if (purchased !== undefined) {
    updates.push('purchased = ?');
    params.push(purchased);
  }

  if (ingredient_name) {
    updates.push('ingredient_name = ?');
    params.push(ingredient_name);
  }

  if (category) {
    updates.push('category = ?');
    params.push(category);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
  params.push(id, userId);

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item updated successfully' });
  });
};

export const deleteShoppingItem = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query(
    'DELETE FROM shopping_list WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ message: 'Item deleted successfully' });
    },
  );
};
