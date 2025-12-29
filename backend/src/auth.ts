import jwt from "jsonwebtoken";

export const signToken = (user: { id: string; role: string }) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
