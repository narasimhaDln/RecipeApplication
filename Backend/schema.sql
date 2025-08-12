CREATE DATABASE recipe_management;

USE recipe_management;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    dietary_preferences JSON,
    allergies JSON,
    skill_level ENUM(
        'beginner',
        'intermediate',
        'advanced'
    ) DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    preference ENUM('preferred', 'avoid') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    recipe_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    recipe_id INT NOT NULL,
    rating INT CHECK (
        rating >= 1
        AND rating <= 5
    ),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    recipe_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE shopping_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ingredient_name VARCHAR(255) NOT NULL,
    amount FLOAT,
    unit VARCHAR(50),
    category VARCHAR(100) DEFAULT 'Other',
    purchased BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE meal_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    recipe_id INT NOT NULL,
    plan_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE recent_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    recipe_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    cuisine VARCHAR(100),
    meal_type VARCHAR(100),
    cook_time INT,
    difficulty ENUM('easy', 'medium', 'hard')
);

CREATE TABLE recipe_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    recipe_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);