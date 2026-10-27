const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// All cart operations require authentication
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.delete("/remove/:bookId", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;
