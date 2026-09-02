import jwt, { JwtPayload, Secret } from "jsonwebtoken";

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string,
): string => {
  const token = jwt.sign(payload, secret, {
    expiresIn: expiresIn,
  } as any);

  return token;
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  try {
    const cleanToken = token.startsWith("Bearer ")
      ? token.slice(7).trim()
      : token.trim();
    const decoded = jwt.verify(cleanToken, secret) as JwtPayload;
    return decoded;
  } catch (err) {
    throw err;
  }
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
