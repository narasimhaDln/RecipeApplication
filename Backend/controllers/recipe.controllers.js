import axios from 'axios';
import cache from '../cache/recipe.cache.js';
import db from '../config/db.config.js';
import dotenv from 'dotenv';

dotenv.config();

const isValidJson = (str) => {
  if (typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

export const searchRecipes = async (req, res) => {
  const { query, cuisine, mealType, maxTime, difficulty } = req.query;
  if (!query)
    return res.status(400).json({ error: 'Query parameter is required' });

  if (!process.env.SPOONACULAR_API_KEY) {
    return res.status(500).json({
      error: 'Spoonacular API key not configured. Please check your .env file.',
    });
  }

  const cacheKey = `recipes_${query}_${cuisine || ''}_${mealType || ''}_${
    maxTime || ''
  }_${difficulty || ''}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const userId = req.user?.id;
    let dietaryPrefs = [];
    let allergyList = [];

    if (userId) {
      db.query(
        'SELECT dietary_preferences, allergies FROM users WHERE id = ?',
        [userId],
        async (err, results) => {
          if (err) {
            console.error('Database error in searchRecipes:', err);
          } else if (results.length > 0) {
            const { dietary_preferences, allergies } = results[0];

            if (dietary_preferences && isValidJson(dietary_preferences)) {
              const parsed = JSON.parse(dietary_preferences);
              dietaryPrefs = Array.isArray(parsed) ? parsed : [];
            }

            if (allergies && isValidJson(allergies)) {
              const parsed = JSON.parse(allergies);
              allergyList = Array.isArray(parsed) ? parsed : [];
            }
          }

          await performSearch();
        },
      );
    } else {
      await performSearch();
    }

    async function performSearch() {
      const params = {
        query,
        cuisine: cuisine || undefined,
        type: mealType || undefined,
        maxReadyTime: maxTime ? parseInt(maxTime) : undefined,
        diet: dietaryPrefs.length ? dietaryPrefs.join(',') : undefined,
        intolerances: allergyList.length ? allergyList.join(',') : undefined,
        apiKey: process.env.SPOONACULAR_API_KEY,
      };

      if (difficulty) params.instructionsRequired = true;

      try {
        console.log('Calling Spoonacular API with params:', {
          ...params,
          apiKey: '***',
        });
        const response = await axios.get(
          'https://api.spoonacular.com/recipes/complexSearch',
          { params },
        );

        if (response.data && response.data.results) {
          cache.set(cacheKey, response.data.results);
          res.json(response.data.results);
        } else {
          console.error(
            'Unexpected Spoonacular response format:',
            response.data,
          );
          res.status(500).json({ error: 'Invalid response from recipe API' });
        }
      } catch (apiError) {
        const errorDetails = {
          status: apiError.response?.status,
          message: apiError.message,
          response: apiError.response?.data,
          url: apiError.config?.url,
        };
        console.error(
          'Spoonacular API error:',
          JSON.stringify(errorDetails, null, 2),
        );

        if (apiError.response?.status === 401) {
          return res.status(500).json({
            error:
              'Spoonacular API authentication failed. Please check the API key in the .env file or verify your API quota.',
          });
        }

        if (apiError.response?.status === 402) {
          return res.status(500).json({
            error:
              'Spoonacular API quota exceeded. Please check your API plan or try again later.',
          });
        }

        res
          .status(500)
          .json({ error: `Recipe search failed: ${apiError.message}` });
      }
    }
  } catch (error) {
    console.error('Unexpected error in searchRecipes:', error);
    res.status(500).json({ error: 'Internal server error occurred' });
  }
};

export const getRecipe = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ error: 'Valid recipe ID is required' });
  const cacheKey = `recipe_${id}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    db.query(
      'INSERT INTO recent_views (user_id, recipe_id, viewed_at) VALUES (?, ?, NOW())',
      [req.user.id, id],
    );
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information`,
      {
        params: { apiKey: process.env.SPOONACULAR_API_KEY },
      },
    );
    cache.set(cacheKey, response.data);
    db.query(
      'INSERT INTO recent_views (user_id, recipe_id, viewed_at) VALUES (?, ?, NOW())',
      [req.user.id, id],
      (err) => {
        if (err) console.error('Failed to log recent view:', err);
      },
    );
    res.json(response.data);
  } catch (apiError) {
    const errorDetails = {
      status: apiError.response?.status,
      message: apiError.message,
      response: apiError.response?.data,
      url: apiError.config?.url,
    };
    console.error(
      'Spoonacular API error:',
      JSON.stringify(errorDetails, null, 2),
    );
    if (apiError.response?.status === 401) {
      return res.status(500).json({
        error:
          'Spoonacular API authentication failed. Please check the API key in the .env file or verify your API quota.',
      });
    }
    res
      .status(500)
      .json({ error: `Spoonacular API error: ${apiError.message}` });
  }
};

export const addFavorite = (req, res) => {
  const { recipeId } = req.body;
  console.log(`addFavorite request body: ${JSON.stringify(req.body)}`);
  if (!recipeId || isNaN(recipeId)) {
    console.error(`Invalid recipeId: ${recipeId}`);
    return res.status(400).json({ error: 'Valid recipe ID is required' });
  }
  db.query(
    'INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)',
    [req.user.id, recipeId],
    (err) => {
      if (err) {
        console.error(`Database error in addFavorite: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Recipe favorited' });
    },
  );
};

export const getFavorites = async (req, res) => {
  console.log(
    `getFavorites called for user ${req.user.id} with query: ${JSON.stringify(
      req.query,
    )}`,
  );
  console.log(`Request URL: ${req.originalUrl}, Method: ${req.method}`);
  db.query(
    'SELECT recipe_id FROM favorites WHERE user_id = ?',
    [req.user.id],
    async (err, results) => {
      if (err) {
        console.error(`Database error in getFavorites: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      console.log(
        `Favorites found for user ${req.user.id}: ${JSON.stringify(results)}`,
      );
      if (results.length === 0) {
        console.log(`No favorites found for user ${req.user.id}`);
        return res.json([]);
      }
      const favorites = [];
      for (const { recipe_id } of results) {
        const cacheKey = `recipe_${recipe_id}`;
        let recipe = cache.get(cacheKey);
        if (!recipe) {
          try {
            console.log(`Fetching recipe ${recipe_id} from Spoonacular`);
            const response = await axios.get(
              `https://api.spoonacular.com/recipes/${recipe_id}/information`,
              {
                params: { apiKey: process.env.SPOONACULAR_API_KEY },
              },
            );
            recipe = response.data;
            cache.set(cacheKey, recipe);
          } catch (apiError) {
            const errorDetails = {
              status: apiError.response?.status,
              message: apiError.message,
              response: apiError.response?.data,
              url: apiError.config?.url,
            };
            console.error(
              `Failed to fetch recipe ${recipe_id}:`,
              JSON.stringify(errorDetails, null, 2),
            );
            if (apiError.response?.status === 401) {
              return res.status(500).json({
                error:
                  'Spoonacular API authentication failed. Please check the API key in the .env file or verify your API quota.',
              });
            }
            continue;
          }
        }
        favorites.push(recipe);
      }
      console.log(
        `Returning ${favorites.length} favorites for user ${req.user.id}`,
      );
      res.json(favorites);
    },
  );
};

export const removeFavorite = (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ error: 'Valid recipe ID is required' });
  db.query(
    'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
    [req.user.id, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Recipe removed from favorites' });
    },
  );
};

export const getRecentViews = async (req, res) => {
  db.query(
    'SELECT recipe_id, MAX(viewed_at) as viewed_at FROM recent_views WHERE user_id = ? GROUP BY recipe_id ORDER BY viewed_at DESC LIMIT 10',
    [req.user.id],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const recent = [];
      for (const { recipe_id } of results) {
        const cacheKey = `recipe_${recipe_id}`;
        let recipe = cache.get(cacheKey);
        if (!recipe) {
          try {
            const response = await axios.get(
              `https://api.spoonacular.com/recipes/${recipe_id}/information`,
              {
                params: { apiKey: process.env.SPOONACULAR_API_KEY },
              },
            );
            recipe = response.data;
            cache.set(cacheKey, recipe);
          } catch (apiError) {
            console.error(
              `Failed to fetch recipe ${recipe_id}:`,
              apiError.message,
            );
            continue;
          }
        }
        recent.push(recipe);
      }
      res.json(recent);
    },
  );
};

export const uploadImage = (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id))
    return res.status(400).json({ error: 'Valid recipe ID is required' });
  if (!req.file)
    return res.status(400).json({ error: 'Image file is required' });
  const imageUrl = `/uploads/images/${req.file.filename}`;
  db.query(
    'INSERT INTO recipe_images (user_id, recipe_id, image_url) VALUES (?, ?, ?)',
    [req.user.id, id, imageUrl],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Image uploaded', imageUrl });
    },
  );
};

export const getRecommendations = async (req, res) => {
  const userId = req.user.id;
  db.query(
    'SELECT recipe_id FROM ratings WHERE user_id = ? AND rating >= 4',
    [userId],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const likedRecipes = results.map((r) => r.recipe_id);
      if (!likedRecipes.length) return res.json([]);
      const recommendations = [];
      for (const recipeId of likedRecipes) {
        try {
          const response = await axios.get(
            `https://api.spoonacular.com/recipes/${recipeId}/similar`,
            {
              params: { apiKey: process.env.SPOONACULAR_API_KEY, number: 5 },
            },
          );
          recommendations.push(...response.data);
        } catch (apiError) {
          console.error(
            `Failed to fetch similar recipes for ${recipeId}:`,
            apiError.message,
          );
        }
      }
      res.json(recommendations);
    },
  );
};
