import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import servicesRoutes from "./routes/services";
import webhookRoutes from "./routes/webhooks";
import "./queue/deployment.worker";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));

app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Serve frontend in production
const clientDistPath = path.join(process.cwd(), "../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(clientDistPath, "index.html"));
    } else {
        res.status(404).json({ error: "Not Found" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
