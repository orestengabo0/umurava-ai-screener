import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserModel, type IUser } from "../models/User.js";
import { sendPasswordResetEmail } from "./email.js";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";
const RESET_TOKEN_EXPIRES_IN = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  token: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, email: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function registerUser(
  data: RegisterData
): Promise<AuthResponse> {
  const { firstName, lastName, email, password } = data;

  // Check if user already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  // Generate token
  const token = generateToken(user._id.toString(), user.email);

  return {
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    token,
  };
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  // Generate token
  const token = generateToken(user._id.toString(), user.email);

  return {
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    token,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN);

  // Save reset token to user
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpiry;
  await user.save();

  // Send password reset email
  await sendPasswordResetEmail({
    to: user.email,
    resetToken,
    firstName: user.firstName,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const user = await UserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user
  user.password = hashedPassword;
  user.resetPasswordToken = undefined as any;
  user.resetPasswordExpires = undefined as any;
  await user.save();
}
