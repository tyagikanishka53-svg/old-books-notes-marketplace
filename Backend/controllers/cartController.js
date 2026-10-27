const Cart = require("../models/Cart");
const Book = require("../models/Book");

// ===============================
// GET USER'S CART
// ===============================
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.book",
      populate: { path: "seller", select: "name email phone" },
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Filter out books that might have been deleted from DB
    const validItems = cart.items.filter((item) => item.book != null);
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Calculate subtotal
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.book ? item.book.price : 0);
    }, 0);

    return res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        items: cart.items,
        total,
      },
    });
  } catch (error) {
    console.error("GET CART ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// ===============================
// ADD BOOK TO CART
// ===============================
const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "This book is no longer available",
      });
    }

    // Seller cannot buy their own book
    if (book.seller.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot add your own listed book to your cart",
      });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if already in cart
    const alreadyInCart = cart.items.some(
      (item) => item.book.toString() === bookId.toString()
    );

    if (alreadyInCart) {
      return res.status(400).json({
        success: false,
        message: "Book is already in your cart",
      });
    }

    cart.items.push({ book: bookId });
    await cart.save();

    // Populate updated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.book",
      populate: { path: "seller", select: "name email phone" },
    });

    const total = updatedCart.items.reduce((sum, item) => {
      return sum + (item.book ? item.book.price : 0);
    }, 0);

    return res.status(200).json({
      success: true,
      message: `"${book.title}" added to cart!`,
      cart: {
        _id: updatedCart._id,
        items: updatedCart.items,
        total,
      },
    });
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add book to cart",
      error: error.message,
    });
  }
};

// ===============================
// REMOVE BOOK FROM CART
// ===============================
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.params;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.book.toString() !== bookId.toString()
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.book",
      populate: { path: "seller", select: "name email phone" },
    });

    const total = updatedCart.items.reduce((sum, item) => {
      return sum + (item.book ? item.book.price : 0);
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart: {
        _id: updatedCart._id,
        items: updatedCart.items,
        total,
      },
    });
  } catch (error) {
    console.error("REMOVE FROM CART ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// ===============================
// CLEAR CART
// ===============================
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart: {
        items: [],
        total: 0,
      },
    });
  } catch (error) {
    console.error("CLEAR CART ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
};
