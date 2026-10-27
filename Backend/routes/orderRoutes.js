const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");

// All order operations require login
router.use(protect);

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/seller-orders", getSellerOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

module.exports = router;
