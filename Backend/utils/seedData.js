const User = require("../models/user");
const Book = require("../models/Book");
const bcrypt = require("bcryptjs");

const seedInitialBooks = async () => {
  try {
    const bookCount = await Book.countDocuments();
    if (bookCount > 0) {
      return; // Books already exist
    }

    // Find or create a demo seller
    let seller = await User.findOne({ email: "seller@oldbooks.com" });
    if (!seller) {
      const hashedPassword = await bcrypt.hash("seller123", 10);
      seller = await User.create({
        name: "Campus Book Store",
        email: "seller@oldbooks.com",
        phone: "9876543210",
        password: hashedPassword,
      });
    }

    const sampleBooks = [
      {
        title: "Engineering Mathematics",
        author: "B. S. Grewal",
        price: 280,
        originalPrice: 650,
        condition: "Good",
        category: "Engineering",
        description: "Standard textbook for engineering students. 44th edition, clean pages with minimal pencil highlights.",
        edition: "44th Edition",
        location: "Delhi",
        seller: seller._id,
        sellerContact: seller.phone,
        status: "available",
      },
      {
        title: "Data Structures and Algorithms in C",
        author: "Seymour Lipschutz",
        price: 350,
        originalPrice: 595,
        condition: "Very Good",
        category: "Computer Science",
        description: "Schaum's Outline Series. Covers arrays, linked lists, trees, graphs with solved questions.",
        edition: "Revised Edition",
        location: "Bengaluru",
        seller: seller._id,
        sellerContact: seller.phone,
        status: "available",
      },
      {
        title: "Operating System Concepts",
        author: "Silberschatz, Galvin & Gagne",
        price: 420,
        originalPrice: 850,
        condition: "Good",
        category: "Computer Science",
        description: "The classic Dinosaur book for OS. Great condition, all chapters intact.",
        edition: "9th Edition",
        location: "Pune",
        seller: seller._id,
        sellerContact: seller.phone,
        status: "available",
      },
      {
        title: "Database System Concepts",
        author: "Silberschatz, Korth & Sudarshan",
        price: 300,
        originalPrice: 720,
        condition: "Like New",
        category: "Computer Science",
        description: "Fundamental database concepts, SQL queries, normalization, and transaction handling.",
        edition: "6th Edition",
        location: "Hyderabad",
        seller: seller._id,
        sellerContact: seller.phone,
        status: "available",
      },
      {
        title: "Concepts of Physics (Vol 1 & 2)",
        author: "H. C. Verma",
        price: 250,
        originalPrice: 490,
        condition: "Good",
        category: "Science",
        description: "Essential guide for physics preparation and competitive exams. Lightly used.",
        edition: "Latest Edition",
        location: "Kota",
        seller: seller._id,
        sellerContact: seller.phone,
        status: "available",
      },
      {
        title: "Discrete Mathematics and Its Applications",
        author: "Kenneth H. Rosen",
        price: 390,
        originalPrice: 795,
        condition: "Good",
        category: "Mathematics",
        description: "Comprehensive guide for CS and IT undergraduates. Thorough mathematical foundations.",
        edition: "7th Edition",
        location: "Mumbai",
        seller: seller._id,
        sellerContact: seller.phone,
        status: "available",
      },
    ];

    await Book.insertMany(sampleBooks);
    console.log("Seeded initial marketplace books successfully!");
  } catch (error) {
    console.error("Error seeding initial books:", error.message);
  }
};

module.exports = seedInitialBooks;
