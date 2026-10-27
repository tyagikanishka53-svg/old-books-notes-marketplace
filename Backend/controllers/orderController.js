const Order = require("../models/Order");
const Book = require("../models/Book");
const Cart = require("../models/Cart");

// ===============================
// CREATE ORDER (Place Order / Checkout)
// ===============================
const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.userId;
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one book",
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required",
      });
    }

    // Validate books and prepare order items
    const orderItems = [];
    let calculatedTotal = 0;
    const bookIdsToMarkSold = [];

    for (const item of items) {
      const bookId = item.bookId || item._id || (item.book && item.book._id);

      if (!bookId) {
        return res.status(400).json({
          success: false,
          message: "Invalid item in order list",
        });
      }

      const book = await Book.findById(bookId);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: `Book not found (ID: ${bookId})`,
        });
      }

      if (book.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `"${book.title}" is already sold or unavailable`,
        });
      }

      if (book.seller.toString() === buyerId.toString()) {
        return res.status(400).json({
          success: false,
          message: `You cannot purchase your own book: "${book.title}"`,
        });
      }

      orderItems.push({
        book: book._id,
        title: book.title,
        author: book.author,
        price: book.price,
        imageUrl: book.imageUrl || "",
        seller: book.seller,
      });

      calculatedTotal += book.price;
      bookIdsToMarkSold.push(book._id);
    }

    // Create Order
    const order = await Order.create({
      buyer: buyerId,
      items: orderItems,
      totalAmount: calculatedTotal,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state ? shippingAddress.state.trim() : "",
        pincode: shippingAddress.pincode.trim(),
      },
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus:
        paymentMethod === "Cash on Delivery" ? "Pending" : "Completed",
      orderStatus: "Placed",
      notes: notes ? notes.trim() : "",
    });

    // Mark books as sold
    await Book.updateMany(
      { _id: { $in: bookIdsToMarkSold } },
      { $set: { status: "sold" } }
    );

    // Remove purchased books from all users' carts
    await Cart.updateMany(
      {},
      { $pull: { items: { book: { $in: bookIdsToMarkSold } } } }
    );

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

// ===============================
// GET MY ORDERS (Buyer)
// ===============================
const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user.userId;

    const orders = await Order.find({ buyer: buyerId })
      .populate("items.seller", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ===============================
// GET SELLER ORDERS (Sales received)
// ===============================
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const orders = await Order.find({
      "items.seller": sellerId,
    })
      .populate("buyer", "name email phone")
      .sort({ createdAt: -1 });

    // Filter order items to only those belonging to this seller
    const sellerSpecificOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => item.seller.toString() === sellerId.toString()
      );
      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price,
        0
      );
      return {
        _id: order._id,
        createdAt: order.createdAt,
        buyer: order.buyer,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        items: sellerItems,
        sellerTotal,
      };
    });

    return res.status(200).json({
      success: true,
      count: sellerSpecificOrders.length,
      orders: sellerSpecificOrders,
    });
  } catch (error) {
    console.error("GET SELLER ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller orders",
      error: error.message,
    });
  }
};

// ===============================
// GET ORDER BY ID
// ===============================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await Order.findById(id)
      .populate("buyer", "name email phone")
      .populate("items.seller", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isBuyer = order.buyer._id.toString() === userId.toString();
    const isSeller = order.items.some(
      (item) => item.seller && item.seller._id.toString() === userId.toString()
    );

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("GET ORDER BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ===============================
// CANCEL ORDER
// ===============================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.buyer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
    }

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    // Revert books status to available
    const bookIds = order.items.map((item) => item.book);
    await Book.updateMany(
      { _id: { $in: bookIds } },
      { $set: { status: "available" } }
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully. Books are now available again.",
      order,
    });
  } catch (error) {
    console.error("CANCEL ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  cancelOrder,
};
