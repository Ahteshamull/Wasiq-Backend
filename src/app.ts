import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import bodyParser from "body-parser";
import compression from "compression";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

import { getSystemHealthInfo } from "./utils/systemInfo";
import { generateHealthHTML } from "./utils/generateHealthHTML";

const app: Application = express();

// AWS / Reverse Proxy setup
app.set("trust proxy", true);

// Enable Gzip/Brotli response compression for all outgoing requests
app.use(
  compression({
    level: 6,
    threshold: 1024, // only compress responses above 1KB
  })
);

export const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(
  bodyParser.json({
    limit: "50mb",
    verify: function (
      req: express.Request,
      res: express.Response,
      buf: Buffer,
    ) {
      req.rawBody = buf;
    },
  }),
);

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));


app.use(express.static("public"));

// Route handler for the root endpoint
app.get("/", async (req: Request, res: Response) => {
  const healthInfo = await getSystemHealthInfo();

  // Check if client prefers JSON (e.g., monitoring tools, curl)
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.send(healthInfo);
  }

  // Otherwise return the beautiful HTML dashboard
  const html = generateHealthHTML(healthInfo);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve static files from the "uploads" directory

// Setup API routes
app.use("/api/v1", router);

// Error handling middleware
app.use(GlobalErrorHandler);

// 404 Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
