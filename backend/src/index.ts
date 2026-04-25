// src/index.ts
// main entry point for the backend server

import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/db.ts";
import jobRoutes from "./routes/jobRoutes.ts";
import applicantRoutes from "./routes/applicantRoutes.ts";
import resumeRoutes from "./routes/resumeRoutes.ts";
import dashboardRoutes from "./routes/dashboardRoutes.ts";
import authRoutes from "./routes/authRoutes.ts";
import settingsRoutes from "./routes/settingsRoutes.ts";
import screenRoutes from "./routes/screenRoutes.ts";
import { openApiSpec } from "./swagger.ts";

async function bootstrap() {
  const port = Number(process.env.PORT ?? 5000);

  await connectDB();

  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",").map(origin => origin.trim());

  console.log("CORS_ORIGINS:", process.env.CORS_ORIGINS);

  app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
  app.use(express.json({ limit: "2mb" }));

  // Routes
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(openApiSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
    }),
  );

  // Auth routes (public + protected)
  app.use("/api/auth", authRoutes);

  // Protected routes
  app.use("/api/jobs", jobRoutes);
  app.use("/api/applicants", applicantRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/screen", screenRoutes);
  app.use("/api", resumeRoutes);

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  });

  app.listen(port, () => {
    // Intentionally keep logging minimal for now
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
