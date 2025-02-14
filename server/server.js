require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// ✅ Connect to MySQL Database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("Database connection failed:", err);
  else console.log("✅ Connected to MySQL Database");
});

// ✅ Configure Image Upload
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" });
};



const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Get token from headers

    if (!token) {
        return res.status(401).json({ error: "Access Denied! No token provided." });
    }

    jwt.verify(token, "SocialMediaFeed", (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token!" });

        req.user = decoded; // Store user data in request
        next();
    });
};

// Register User
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Insert user into database (adjust based on your DB)
    const newUser = { username, email, password }; // Replace with DB logic

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// User Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ message: "Login successful", token });
  });
});

// Get All Posts
app.get("/posts", (req, res) => {
  const sql = `
    SELECT posts.*, users.username 
    FROM posts 
    JOIN users ON posts.user_id = users.id 
    ORDER BY posts.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch posts" });
    res.json(results);
  });
});

//  Create a Post
app.post("/post", authenticateUser, upload.single("image"), (req, res) => {
    const { postname, content } = req.body;
    const image = req.file ? req.file.filename : null;
    const user_id = req.user.id; 

    if (!postname || !content) {
        return res.status(400).json({ error: "Postname and content are required!" });
    }

    const insertQuery = "INSERT INTO posts (user_id, postname, content, image) VALUES (?, ?, ?, ?)";
    db.query(insertQuery, [user_id, postname, content, image], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });

        res.json({ message: " Post created successfully!", postId: result.insertId });
    });
});






app.post("/like/:postId", async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.body; 

  try {
    
    const [existing] = await db.promise().query(
      "SELECT * FROM likes_dislikes WHERE user_id = ? AND post_id = ?",
      [user_id, postId]
    );

    if (existing.length > 0) {
  
      await db.promise().query(
        "UPDATE likes_dislikes SET action = 'like' WHERE user_id = ? AND post_id = ?",
        [user_id, postId]
      );
    } else {
      
      await db.promise().query(
        "INSERT INTO likes_dislikes (user_id, post_id, action) VALUES (?, ?, 'like')",
        [user_id, postId]
      );
    }

    res.status(200).json({ message: "Post liked successfully!" });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

app.post("/dislike/:postId", async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.body;

  try {
  
    const [existing] = await db.promise().query(
      "SELECT * FROM likes_dislikes WHERE user_id = ? AND post_id = ?",
      [user_id, postId]
    );

    if (existing.length > 0) {
      
      await db.promise().query(
        "UPDATE likes_dislikes SET action = 'dislike' WHERE user_id = ? AND post_id = ?",
        [user_id, postId]
      );
    } else {
    
      await db.promise().query(
        "INSERT INTO likes_dislikes (user_id, post_id, action) VALUES (?, ?, 'dislike')",
        [user_id, postId]
      );
    }

    res.status(200).json({ message: "Post disliked successfully!" });
  } catch (error) {
    console.error("Error disliking post:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


app.get("/likes/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const [result] = await db.promise().query(
      "SELECT SUM(action = 'like') AS likes, SUM(action = 'dislike') AS dislikes FROM likes_dislikes WHERE post_id = ?",
      [postId]
    );

    res.json(result[0] || { likes: 0, dislikes: 0 });
  } catch (error) {
    console.error("Error fetching likes/dislikes:", error);
    res.status(500).json({ error: "Database error" });
  }
});



//  Add Comment
app.post("/comment", (req, res) => {
  const { user_id, post_id, comment } = req.body;

  if (!comment.trim()) return res.status(400).json({ error: "Comment cannot be empty!" });

  const sql = "INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)";
  db.query(sql, [user_id, post_id, comment], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to add comment" });
      res.json({ message: "Comment added successfully!" });
  });
});

//  Get Comments for a Post
app.get("/post/:id/comments", (req, res) => {
  const sql = `
      SELECT c.comment, c.created_at, u.username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? 
      ORDER BY c.created_at DESC
  `;
  db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch comments" });
      res.json(results);
  });
});






// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
