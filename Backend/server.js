const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const seedInitialBooks = require("./utils/seedData");

const app = express();

// ===============================
// Middleware
// ===============================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ===============================
// Test / Health Route
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Old Books Marketplace API is running!",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// API Routes
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// ===============================
// 404 JSON Handler
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===============================
// Global Error Handler (JSON)
// ===============================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ===============================
// MongoDB + Server Start
// ===============================

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/oldbooks";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected successfully");
    await seedInitialBooks();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});