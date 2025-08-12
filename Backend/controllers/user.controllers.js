import db from '../config/db.config.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const normalizeToArray = (input, fieldName) => {
  if (Array.isArray(input)) {
    if (input.every((item) => typeof item === 'string')) return input;
    console.error(
      `Invalid ${fieldName} array elements: ${JSON.stringify(
        input,
      )}. Must be strings.`,
    );
    return [];
  }
  if (typeof input === 'string') {
    console.warn(`Invalid ${fieldName} input: ${input}. Converting to array.`);
    return [input];
  }
  if (input === undefined || input === null) return [];
  console.error(
    `Invalid ${fieldName} input: ${JSON.stringify(
      input,
    )}. Defaulting to empty array.`,
  );
  return [];
};

export const register = async (req, res) => {
  const {
    username,
    email,
    password,
    dietaryPreferences,
    allergies,
    skillLevel,
  } = req.body;

  if (!username || !email || !password)
    return res
      .status(400)
      .json({ error: 'Username, email, and password are required' });

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    console.error(
      `Invalid input types: username=${typeof username}, email=${typeof email}, password=${typeof password}`,
    );
    return res
      .status(400)
      .json({ error: 'Username, email, and password must be strings' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const dietaryPrefs = normalizeToArray(
    dietaryPreferences,
    'dietaryPreferences',
  );
  const allergyList = normalizeToArray(allergies, 'allergies');

  const query =
    'INSERT INTO users (username, email, password, dietary_preferences, allergies, skill_level) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(
    query,
    [
      username,
      email,
      hashedPassword,
      JSON.stringify(dietaryPrefs),
      JSON.stringify(allergyList),
      skillLevel || 'beginner',
    ],
    (err) => {
      if (err) {
        console.error(`Database error during registration: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User registered' });
    },
  );
};

export const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (
        err ||
        results.length === 0 ||
        !(await bcrypt.compare(password, results[0].password))
      ) {
        console.error(
          `Login failed: err=${err?.message}, userExists=${results.length > 0}`,
        );
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      res.json({ token, username: results[0].username });
    },
  );
};

export const getProfile = (req, res) => {
  db.query(
    'SELECT username, email, dietary_preferences, allergies, skill_level FROM users WHERE id = ?',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length)
        return res.status(404).json({ error: 'User not found' });
      res.json(results[0]);
    },
  );
};

export const updateProfile = async (req, res) => {
  const {
    username,
    email,
    password,
    dietaryPreferences,
    allergies,
    skillLevel,
  } = req.body;

  if (!username || !email)
    return res.status(400).json({ error: 'Username and email are required' });

  if (typeof username !== 'string' || typeof email !== 'string') {
    console.error(
      `Invalid input types: username=${typeof username}, email=${typeof email}`,
    );
    return res
      .status(400)
      .json({ error: 'Username and email must be strings' });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  const dietaryPrefs = normalizeToArray(
    dietaryPreferences,
    'dietaryPreferences',
  );
  const allergyList = normalizeToArray(allergies, 'allergies');

  const query =
    'UPDATE users SET username = ?, email = ?, password = COALESCE(?, password), dietary_preferences = ?, allergies = ?, skill_level = ? WHERE id = ?';
  db.query(
    query,
    [
      username,
      email,
      hashedPassword,
      JSON.stringify(dietaryPrefs),
      JSON.stringify(allergyList),
      skillLevel || 'beginner',
      req.user.id,
    ],
    (err) => {
      if (err) {
        console.error(`Database error during profile update: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Profile updated' });
    },
  );
};

export const getIngredients = (req, res) => {
  db.query(
    'SELECT name, preference FROM ingredients WHERE user_id = ?',
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

export const addIngredients = (req, res) => {
  const { ingredients } = req.body;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Ingredients are required' });
  }

  const values = ingredients.map((ing) => [
    req.user.id,
    ing.name,
    ing.preference,
  ]);
  db.query(
    'INSERT INTO ingredients (user_id, name, preference) VALUES ?',
    [values],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Ingredients added successfully' });
    },
  );
};

export const updateIngredients = (req, res) => {
  const { ingredients } = req.body;
  if (!Array.isArray(ingredients))
    return res.status(400).json({ error: 'Ingredients must be an array' });

  db.query(
    'DELETE FROM ingredients WHERE user_id = ?',
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      const values = ingredients.map((ing) => [
        req.user.id,
        ing.name,
        ing.preference,
      ]);
      db.query(
        'INSERT INTO ingredients (user_id, name, preference) VALUES ?',
        [values],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Ingredients updated' });
        },
      );
    },
  );
};

export const getDashboard = (req, res) => {
  const userId = req.user.id;
  const stats = {};

  db.query(
    'SELECT COUNT(DISTINCT recipe_id) as viewed FROM recent_views WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.viewed = results[0].viewed;

      db.query(
        'SELECT COUNT(*) as favorited FROM favorites WHERE user_id = ?',
        [userId],
        (err, results) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.favorited = results[0].favorited;

          db.query(
            'SELECT COUNT(*) as rated FROM ratings WHERE user_id = ?',
            [userId],
            (err, results) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.rated = results[0].rated;

              db.query(
                'SELECT COUNT(*) as commented FROM comments WHERE user_id = ?',
                [userId],
                (err, results) => {
                  if (err) return res.status(500).json({ error: err.message });
                  stats.commented = results[0].commented;
                  res.json(stats);
                },
              );
            },
          );
        },
      );
    },
  );
};
