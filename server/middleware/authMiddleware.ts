import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "thebestcoderinthetown";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.id) {
      res.clearCookie("token", { path: "/" });
      return res.status(401).json({ message: "Invalid token format" });
    }

    req.user = decoded;
    next();
  } catch {
    res.clearCookie("token", { path: "/" });
    return res.status(401).json({ message: "Invalid token" });
  }
};
