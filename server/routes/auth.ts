import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/dbConfig";
import { authMiddleware } from "../middleware/authMiddleware";
import passport from "passport";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// GitHub Auth
router.get("/github", (req, res, next) => {
  const { join_code } = req.query;
  if (join_code) {
    res.cookie("holonet_join_code", join_code, {
      maxAge: 15 * 60 * 1000, 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  passport.authenticate("github")(req, res, next);
});

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=auth_failed" }),
  (req: Request, res: Response) => {
    const user = req.user as any;

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.clearCookie("holonet_join_code");

    res.redirect(process.env.CORS_ORIGIN || "http://localhost:5173");
  }
);

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
};

router.post("/register", async (req: Request, res: Response) => {
  try {
    let { username, email, password } = req.body;

    username = username?.trim();
    email = email?.trim().toLowerCase();

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: "Username must be 3-30 characters and contain only letters, numbers, and underscores"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [username, hashedPassword, email]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at },
    });
  } catch (error: any) {
    if (error.code === "23505") {
      const detail: string = error.detail || "";
      if (detail.includes("username")) {
        return res.status(409).json({ message: "Username already taken" });
      }
      if (detail.includes("email")) {
        return res.status(409).json({ message: "Email already registered" });
      }
      return res.status(409).json({ message: "User already exists" });
    }
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT id, username, email, password, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      message: "Login successful",
      user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.json({ message: "Logout successful" });
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const decoded = req.user as { id: string; username: string; email: string };

    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
