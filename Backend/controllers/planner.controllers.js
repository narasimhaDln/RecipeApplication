import db from '../config/db.config.js';
import axios from 'axios';
import cache from '../cache/recipe.cache.js';
import dotenv from 'dotenv';
dotenv.config();

const addToPlan = (req, res) => {
  const { recipeId, date } = req.body;
  if (!recipeId || !date)
    return res.status(400).json({ error: 'Recipe ID and date are required' });
  db.query(
    'INSERT INTO meal_plans (user_id, recipe_id, plan_date) VALUES (?, ?, ?)',
    [req.user.id, recipeId, date],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Recipe added to plan' });
    },
  );
};

const getPlan = async (req, res) => {
  db.query(
    'SELECT id, user_id, recipe_id, plan_date FROM meal_plans WHERE user_id = ?',
    [req.user.id],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const plans = [];
      for (const plan of results) {
        const cacheKey = `recipe_${plan.recipe_id}`;
        let recipe = cache.get(cacheKey);
        if (!recipe) {
          try {
            const response = await axios.get(
              `https://api.spoonacular.com/recipes/${plan.recipe_id}/information`,
              {
                params: { apiKey: process.env.SPOONACULAR_API_KEY },
              },
            );
            recipe = response.data;
            cache.set(cacheKey, recipe);
          } catch (apiError) {
            console.error(
              `Failed to fetch recipe ${plan.recipe_id}:`,
              apiError.message,
            );
            continue;
          }
        }
        plans.push({ ...plan, title: recipe.title });
      }
      res.json(plans);
    },
  );
};

const updatePlan = (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  db.query(
    'UPDATE meal_plans SET plan_date = ? WHERE id = ? AND user_id = ?',
    [date, id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res
          .status(404)
          .json({ error: 'Meal plan not found or not authorized' });
      res.json({ message: 'Meal plan updated' });
    },
  );
};

const removeFromPlan = (req, res) => {
  const { id } = req.params;
  db.query(
    'DELETE FROM meal_plans WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0)
        return res
          .status(404)
          .json({ error: 'Meal plan not found or not authorized' });
      res.json({ message: 'Recipe removed from plan' });
    },
  );
};

export { addToPlan, getPlan, updatePlan, removeFromPlan };
