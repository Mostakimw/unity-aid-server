const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("unity-aid");
    const collection = db.collection("users");
    const donationCollection = db.collection("donations");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;
      console.log(req.body);

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================

    //! donation data create api
    app.post("/api/v1/donations/create", async (req, res) => {
      const data = req.body;
      try {
        const result = await donationCollection.insertOne(data);
        res.status(201).json({
          success: true,
          message: "Donation data created successfully",
          data: data,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "An error occurred while creating donation data",
        });
      }
    });

    //! donation data fetching api
    app.get("/api/v1/donations", async (req, res) => {
      try {
        const result = await donationCollection.find().toArray();
        console.log(result);
        res.status(201).json({
          success: true,
          message: "Donation data fetched successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "An error occurred while fetching donation data",
        });
      }
    });

    //! single donation data api
    app.get("/api/v1/donations/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await donationCollection.findOne({ _id: new ObjectId(id) });
        console.log(result);
        res.status(201).json({
          success: true,
          message: "Donation data fetched successfully",
          data: result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "An error occurred while fetching donation data",
        });
      }
    });

    //! edit donation data api (including delete data and update received amount)

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
