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
  role: "superadmin" | "admin" | "employee" | "guest";
};

export const signToken = (user: { id: string; role: TokenPayload["role"] }) =>
  jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
};
