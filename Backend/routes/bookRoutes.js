const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getAllBooks,
  getFeaturedBooks,
  getBookById,
  getMyBooks,
  createBook,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

// Public routes
router.get("/", getAllBooks);
router.get("/featured", getFeaturedBooks);

// Protected: Get books listed by current user (must be before /:id)
router.get("/my-books", protect, getMyBooks);

// Public route: Get book by ID
router.get("/:id", getBookById);

// Protected routes: Create, update, delete
router.post("/", protect, createBook);
router.put("/:id", protect, updateBook);
router.delete("/:id", protect, deleteBook);

module.exports = router;
