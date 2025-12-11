🚀 Features
🔐 Authentication

Secure Login & Signup

Password hashing

JWT-based authentication

📝 Notes Management

Create, edit, and delete notes

Search notes

Pin important notes

Add categories

Color-coded notes

Reminder notifications (browser alerts)

🎨 Modern UI

Fully responsive layout

Smooth animations

Dark & light mode

Organized card layout

☁ Backend API (Node.js + Express + MongoDB)

REST API endpoints:

POST /auth/signup

POST /auth/login

GET /notes

POST /notes

PUT /notes/:id

DELETE /notes/:id

GET /reminders/upcoming

📁 Project Structure
notespace_project/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   └── ...
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── package.json
├── README.md
└── .env.example

🛠️ Installation & Setup
1. Install dependencies
npm install

2. Create .env file

Rename .env.example → .env, then fill in:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000

3. Start the server
npm start


Your backend will run at:

http://localhost:5000


The frontend is served automatically by Express.

🧪 Testing APIs

You can test using:

Postman

Thunder Client (VS Code)

curl

Authorization:
Use the JWT token you receive on login for all /notes routes.

🌐 Deployment Options

You can deploy using:

Render (best for backend)

Railway

Vercel + Render combo

Heroku (if available)

If you want, I can prepare your exact deployment instructions.

📜 License

This project is created as part of an engineering assignment.
