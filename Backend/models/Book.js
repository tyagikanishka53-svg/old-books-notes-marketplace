const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: [120, "Author cannot exceed 120 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Engineering",
        "Computer Science",
        "Mathematics",
        "Science",
        "School Books",
        "Literature",
        "Medical",
        "Commerce",
        "Other",
      ],
      default: "Computer Science",
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: ["New", "Like New", "Very Good", "Good", "Fair"],
      default: "Good",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    edition: {
      type: String,
      trim: true,
      default: "",
    },
    isbn: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerContact: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ title: "text", author: "text", description: "text" });

module.exports = mongoose.model("Book", bookSchema);
