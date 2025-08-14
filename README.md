# RecipeApplication

# 🍲 RecipeApplication

A **full-stack Recipe Management System** that allows users to create profiles, search for recipes, plan meals, rate dishes, post comments, and manage shopping lists.  
Built with **Node.js**, **Express**, **MySQL**, and vanilla **JavaScript** for the frontend, featuring an **API-powered recipe search**.

---

## 🌟 Features

✅ **User Authentication** (JWT-based)  
✅ **Recipe Search & Filters** (Powered by Spoonacular API)  
✅ **Meal Planner** with calendar-based scheduling  
✅ **Ratings & Reviews** for recipes  
✅ **Comment System** for discussions  
✅ **Shopping List Management**  
✅ **Caching Layer** for faster API responses (using in-memory caching)  
✅ **Responsive Frontend UI** built with HTML, CSS, and JavaScript

---

## 🛠 Tech Stack

### **Frontend**

- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

### **Backend**

- ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
- ![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
- ![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
- ![dotenv](https://img.shields.io/badge/dotenv-000000?logo=dotenv&logoColor=white)

### **Tools & Utilities**

- ![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?logo=nodemon&logoColor=white)
- ![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white)
- ![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white)
- ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)

---

## 📂 Project Structure

RecipeApplication/
│
├── backend/
│ ├── cache/
│ │ └── recipe.cache.js
│ ├── config/
│ │ └── db.config.js
│ ├── controllers/
│ │ ├── comment.controllers.js
│ │ ├── planner.controllers.js
│ │ ├── rating.controllers.js
│ │ ├── recipe.controllers.js
│ │ ├── shopping.controllers.js
│ │ └── user.controllers.js
│ ├── middlewares/
│ │ └── auth.middlewares.js
│ ├── routes/
│ │ ├── comment.routes.js
│ │ ├── planner.routes.js
│ │ ├── rating.routes.js
│ │ ├── recipe.routes.js
│ │ ├── shopping.routes.js
│ │ └── user.routes.js
│ ├── schema.sql
│ └── server.js
│
├── frontend/
│ ├── styles/
│ │ └── styles.css
│ ├── index.html
│ └── script.js
│
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md

---
Git Hub Link-https://github.com/narasimhaDln/RecipeApplication
## ⚙️ Installation & Setup

1️⃣ **Clone the repository**

```bash
git clone https://github.com/narasimhaDln/RecipeApplication
cd RecipeApplication
```

2️⃣ Backend Setup

cd backend
npm install

3️⃣ Setup Environment Variables (.env)

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=recipe_db
SPOONACULAR_API_KEY=your_api_key

4️⃣ Run MySQL Schema

mysql -u root -p recipe_db < schema.sql


5️⃣ Start the Backend Server
nodemon server.js

6️⃣ Open the Frontend
Simply open frontend/index.html in your browser or use Live Server.
📡 API Endpoints (Brief Overview)
User

POST /api/users/register → Register a new user

POST /api/users/login → Login and receive JWT

GET /api/users/profile → Get profile (Auth required)

PUT /api/users/profile → Update profile (Auth required)

Recipes

GET /api/recipes/search → Search recipes

GET /api/recipes/:id → Get recipe details (Auth required)

POST /api/recipes/favorites → Add favorite

DELETE /api/recipes/favorites/:id → Remove favorite

Ratings

POST /api/recipes/:id/ratings → Add rating

GET /api/recipes/:id/ratings → Get ratings

Comments

POST /api/recipes/:id/comments → Add comment

GET /api/recipes/:id/comments → Get comments

Meal Planner

POST /api/planner/add_recipe_to_meal_plan → Add recipe to plan

GET /api/planner/get_meal_plan → Get meal plan

Shopping List

POST /api/shopping/list → Generate shopping list

GET /api/shopping/list → Get shopping list
💡 Future Enhancements

User profile picture upload

AI-based recipe recommendations

Offline caching with IndexedDB

Social sharing for recipes
