import "dotenv/config";
import jwt from "jsonwebtoken";

// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set in .env");

// export const signToken = (user: { id: string; role: string }) =>
//   jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });

// export const verifyToken = (token: string) =>
//   jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };

export type TokenPayload = {
  id: string;
  role: "superadmin" | "admin" | "employee" | "google";
  type?: "access" | "refresh"; // Token type identifier for rotation
  iat?: number; // Issued at time
};

/**
 * Access token: 1 day (matches cookie maxAge)
 * Refresh token: 7 days (long-lived for user experience)
 */
const accessExp = Number(process.env.ACCESS_TOKEN_EXPIRY);
const refreshExp = Number(process.env.REFRESH_TOKEN_EXPIRY);

export const signAccessToken = (user: { id: string; role: TokenPayload["role"] }) =>
  jwt.sign(
    { id: user.id, role: user.role, type: "access" },
    JWT_SECRET,
    { expiresIn: accessExp || 24 * 60 * 60 }
    // { expiresIn: 1 * 60 }
  );

export const signRefreshToken = (user: { id: string; role: TokenPayload["role"] }) =>
  jwt.sign(
    { id: user.id, role: user.role, type: "refresh" },
    JWT_SECRET,
    { expiresIn: refreshExp || 7 * 24 * 60 * 60 }
  );

/**
 * Returns both new access token and rotated refresh token
 */
export const rotateTokens = (user: { id: string; role: TokenPayload["role"] }) => {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
};

/**
 * Validates token and returns payload with type information
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
};
