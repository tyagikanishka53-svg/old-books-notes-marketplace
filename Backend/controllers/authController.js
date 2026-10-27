const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===============================
// REGISTER
// ===============================
const register = async (req, res) => {
  try {
    console.log("Register request:", req.body);

    const { name, email, phone, password } = req.body;

    // -------------------------------
    // Validation
    // -------------------------------

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    const phoneRegex = /^\d{10}$/;

    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // -------------------------------
    // Check existing user
    // -------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // -------------------------------
    // Hash password
    // -------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // -------------------------------
    // Create user
    // -------------------------------

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
    });

    // -------------------------------
    // Create JWT
    // -------------------------------

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET || "old_books_jwt_secret_key_2026",
      {
        expiresIn: "7d",
      }
    );

    // -------------------------------
    // Response
    // -------------------------------

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// LOGIN
// ===============================
const login = async (req, res) => {
  try {
    console.log("Login request:", req.body);

    const { email, password } = req.body;

    // -------------------------------
    // Validation
    // -------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // -------------------------------
    // Find user
    // -------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -------------------------------
    // Compare password
    // -------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -------------------------------
    // Create JWT
    // -------------------------------

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET || "old_books_jwt_secret_key_2026",
      {
        expiresIn: "7d",
      }
    );

    // -------------------------------
    // Response
    // -------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};