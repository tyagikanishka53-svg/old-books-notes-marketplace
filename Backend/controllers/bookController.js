const Book = require("../models/Book");
const Cart = require("../models/Cart");

// ===============================
// GET ALL BOOKS (Browse / Search / Filter)
// ===============================
const getAllBooks = async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      status,
      sort = "-createdAt",
      limit,
    } = req.query;

    const query = {};

    // By default, only show available books in public browse unless specified
    if (status && status !== "all") {
      query.status = status;
    } else if (!status) {
      query.status = "available";
    }

    // Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Condition filter
    if (condition && condition !== "All") {
      query.condition = condition;
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search filter (title, author, description)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    let booksQuery = Book.find(query)
      .populate("seller", "name email phone")
      .sort(sort);

    if (limit) {
      booksQuery = booksQuery.limit(Number(limit));
    }

    const books = await booksQuery.exec();

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error("GET ALL BOOKS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch books",
      error: error.message,
    });
  }
};

// ===============================
// GET FEATURED / RECENT BOOKS
// ===============================
const getFeaturedBooks = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 4;
    const books = await Book.find({ status: "available" })
      .populate("seller", "name email phone")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      books,
    });
  } catch (error) {
    console.error("GET FEATURED BOOKS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch featured books",
      error: error.message,
    });
  }
};

// ===============================
// GET BOOK BY ID
// ===============================
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id).populate(
      "seller",
      "name email phone"
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error("GET BOOK BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch book details",
      error: error.message,
    });
  }
};

// ===============================
// GET MY BOOKS (Logged in seller)
// ===============================
const getMyBooks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const books = await Book.find({ seller: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error("GET MY BOOKS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your books",
      error: error.message,
    });
  }
};

// ===============================
// CREATE NEW BOOK (Sell Book)
// ===============================
const createBook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      author,
      price,
      originalPrice,
      category,
      condition,
      description,
      edition,
      isbn,
      imageUrl,
      location,
      sellerContact,
    } = req.body;

    if (!title || !author || price === undefined || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, author, price, category, and condition",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      category,
      condition,
      description: description ? description.trim() : "",
      edition: edition ? edition.trim() : "",
      isbn: isbn ? isbn.trim() : "",
      imageUrl: imageUrl ? imageUrl.trim() : "",
      location: location ? location.trim() : "",
      seller: userId,
      sellerContact: sellerContact ? sellerContact.trim() : "",
      status: "available",
    });

    const populatedBook = await Book.findById(newBook._id).populate(
      "seller",
      "name email phone"
    );

    return res.status(201).json({
      success: true,
      message: "Book listed successfully for sale!",
      book: populatedBook,
    });
  } catch (error) {
    console.error("CREATE BOOK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create book listing",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE BOOK
// ===============================
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.seller.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this book",
      });
    }

    const updatableFields = [
      "title",
      "author",
      "price",
      "originalPrice",
      "category",
      "condition",
      "description",
      "edition",
      "isbn",
      "imageUrl",
      "location",
      "sellerContact",
      "status",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    await book.save();

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    console.error("UPDATE BOOK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update book",
      error: error.message,
    });
  }
};

// ===============================
// DELETE BOOK
// ===============================
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.seller.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this book",
      });
    }

    await Book.findByIdAndDelete(id);

    // Remove from cart if anyone has it in cart
    await Cart.updateMany(
      {},
      { $pull: { items: { book: id } } }
    );

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BOOK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete book",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBooks,
  getFeaturedBooks,
  getBookById,
  getMyBooks,
  createBook,
  updateBook,
  deleteBook,
};
