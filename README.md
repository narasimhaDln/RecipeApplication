# RecipeApplication

Getting recipes in this aapplication
RecipiApplication/
│
├── backend/
│ ├── cache/
│ │ └── recipe.cache.js
│ │
│ ├── config/
│ │ └── db.config.js
│ │
│ ├── controllers/
│ │ ├── comment.controller.js
│ │ ├── planner.controller.js
│ │ ├── rating.controller.js
│ │ ├── recipe.controller.js
│ │ ├── shopping.controller.js
│ │ └── user.controller.js
│ │
│ ├── middlewares/
│ │ └── auth.middleware.js
│ │
│ ├── routes/
│ │ ├── comment.routes.js
│ │ ├── planner.routes.js
│ │ ├── rating.routes.js
│ │ ├── recipe.routes.js
│ │ ├── shopping.routes.js
│ │ └── user.routes.js
│ │
│ ├── models/
│ │ └── (future Mongoose/Sequelize/MySQL models)
│ │
│ ├── utils/
│ │ └── helper.js (optional utility functions)
│ │
│ ├── schema.sql
│ ├── server.js
│ ├── package.json # (Backend-specific if split deployment)
│ └── .env # (Backend env variables)
│
├── frontend/
│ ├── styles/
│ │ └── styles.css
│ │
│ ├── index.html
│ ├── script.js
│ └── assets/ # images, icons, logos
│
├── .gitignore
├── package.json # (Root if monorepo deployment)
├── package-lock.json
├── README.md
