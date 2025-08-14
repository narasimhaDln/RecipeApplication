🍲 RecipeApplication
A full-stack Recipe Management System that empowers users to create profiles, search for recipes, plan meals, rate dishes, post comments, and manage shopping lists. Built with a modern tech stack, it leverages the Spoonacular API for recipe data and provides a seamless, responsive user experience.

🌟 Features

✅ User Authentication: Secure JWT-based login and registration system.
✅ Recipe Search & Filters: Search recipes with filters for cuisine, meal type, preparation time, and dietary preferences using the Spoonacular API.
✅ Meal Planner: Schedule recipes on a calendar-based meal plan for easy weekly organization.
✅ Ratings & Reviews: Rate and review recipes to share feedback.
✅ Comment System: Engage in recipe discussions with a commenting feature.
✅ Shopping List Management: Generate and manage shopping lists based on selected recipes.
✅ Caching Layer: In-memory caching for faster API responses.
✅ Responsive Frontend: Clean, user-friendly UI built with vanilla JavaScript, HTML, and CSS.


🛠 Tech Stack
Frontend

HTML5: Structure for the responsive user interface.
CSS3: Custom styles for a modern and clean design.
Vanilla JavaScript: Dynamic client-side functionality without frameworks.

Backend

Node.js: Server-side runtime for handling API requests.
Express.js: Web framework for building RESTful APIs.
MySQL: Relational database for storing user data, meal plans, and shopping lists.
Spoonacular API: External API for recipe search and details.

Tools & Utilities

Nodemon: Auto-restarts the server during development.
Axios: Promise-based HTTP client for API calls.
JWT: JSON Web Tokens for secure authentication.
Multer: Middleware for handling file uploads (e.g., recipe images).


📂 Project Structure
RecipeApplication/
├── backend/
│   ├── cache/
│   │   └── recipe.cache.js         # In-memory caching for API responses
│   ├── config/
│   │   └── db.config.js           # MySQL database configuration
│   ├── controllers/
│   │   ├── comment.controllers.js # Handles comment-related logic
│   │   ├── planner.controllers.js # Manages meal planning
│   │   ├── rating.controllers.js  # Manages recipe ratings
│   │   ├── recipe.controllers.js  # Handles recipe search and favorites
│   │   ├── shopping.controllers.js # Manages shopping lists
│   │   └── user.controllers.js     # Handles user authentication and profiles
│   ├── middlewares/
│   │   └── auth.middleware.js      # JWT authentication middleware
│   ├── routes/
│   │   ├── comment.routes.js       # Comment-related API routes
│   │   ├── planner.routes.js       # Meal planner routes
│   │   ├── rating.routes.js        # Rating routes
│   │   ├── recipe.routes.js        # Recipe routes
│   │   ├── shopping.routes.js      # Shopping list routes
│   │   └── user.routes.js          # User routes
│   ├── schema.sql                 # MySQL schema for database setup
│   └── server.js                  # Main Express server
├── frontend/
│   ├── styles/
│   │   └── styles.css             # Custom CSS styles
│   ├── index.html                 # Main HTML file
│   └── script.js                  # Frontend JavaScript logic
├── .env                           # Environment variables
├── .gitignore                     # Git ignore file
├── package-lock.json              # Dependency lock file
├── package.json                   # Project metadata and dependencies
└── README.md                      # Project documentation


🔗 GitHub Repository
RecipeApplication on GitHub

⚙️ Installation & Setup
Follow these steps to set up and run the project locally.
1. Clone the Repository
git clone https://github.com/narasimhaDln/RecipeApplication
cd RecipeApplication

2. Backend Setup
Install dependencies and set up the server:
cd backend
npm install

3. Configure Environment Variables
Create a .env file in the backend/ directory with the following:
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=recipe_management
SPOONACULAR_API_KEY=your_api_key


Replace yourpassword with your MySQL password.
Obtain a Spoonacular API key from spoonacular.com/food-api.

4. Set Up the MySQL Database
Run the schema to create the database and tables:
mysql -u root -p recipe_management < backend/schema.sql

5. Start the Backend Server
cd backend
npm start

The server will run on http://localhost:5000.
6. Run the Frontend
Open frontend/index.html in a browser or use a tool like Live Server (VS Code extension) for a better development experience:
code frontend/index.html


📡 API Endpoints
User

POST /api/users/register: Register a new user.
POST /api/users/login: Log in and receive a JWT token.
GET /api/users/profile: Retrieve user profile (Auth required).
PUT /api/users/profile: Update user profile (Auth required).

Recipes

GET /api/recipes/search: Search recipes with filters (e.g., cuisine, meal type).
GET /api/recipes/:id: Get detailed recipe information (Auth required).
POST /api/recipes/favorites: Add a recipe to favorites (Auth required).
DELETE /api/recipes/favorites/:id: Remove a recipe from favorites (Auth required).
POST /api/recipes/:id/image: Upload an image for a recipe (Auth required).

Ratings

POST /api/recipes/:id/ratings: Submit a rating for a recipe (Auth required).
GET /api/recipes/:id/ratings: Retrieve ratings for a recipe.

Comments

POST /api/recipes/:id/comments: Add a comment to a recipe (Auth required).
GET /api/recipes/:id/comments: Retrieve comments for a recipe.

Meal Planner

POST /api/planner/add_recipe_to_meal_plan: Add a recipe to the meal plan (Auth required).
GET /api/planner/get_meal_plan: Retrieve the user’s meal plan (Auth required).

Shopping List

POST /api/shopping/list: Generate a shopping list from recipe IDs (Auth required).
GET /api/shopping/list: Retrieve the user’s shopping list (Auth required).
PUT /api/shopping/list: Update shopping list items (e.g., mark as purchased, Auth required).
DELETE /api/shopping/list: Clear the shopping list (Auth required).


💡 Future Enhancements

User Profile Picture Upload: Allow users to upload and manage profile images.
AI-Based Recipe Recommendations: Implement machine learning for personalized recipe suggestions.
Offline Caching with IndexedDB: Enable offline access to recipes and shopping lists.
Social Sharing: Add functionality to share recipes on social media platforms.


🚀 Why This Project Stands Out

Scalable Architecture: Modular backend with separate controllers and routes for maintainability.
Performance Optimization: In-memory caching reduces API calls to the Spoonacular API.
User-Centric Design: Intuitive frontend with responsive design for all devices.
Secure Authentication: JWT-based authentication ensures secure access to user-specific features.


Built with ❤️ by narasimhaDln
