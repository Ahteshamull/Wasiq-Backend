import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { jwtHelpers } from "../../helpars/jwtHelpers";
import prisma from "../../shared/prisma";

// Optional auth middleware - if token exists, attach user; if not, continue without error
const optionalAuth = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.headers.authorization;

    if (token) {
      if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
      }

      if (!token || token === "undefined" || token === "null") {
        return next();
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      );

      const user = await prisma.user.findUnique({
        where: { email: verifiedUser.email },
      });

      if (user) {
        req.user = verifiedUser;
      }
    }

    next();
  } catch (err) {
    // If token is invalid, just continue without user
    next();
  }
};

export default optionalAuth;
