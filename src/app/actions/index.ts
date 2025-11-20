"use server";

import { signOut } from "@/app/auth";
import { cleanUserForClient } from "@/lib/data-util";
import { dbConnect } from "@/lib/mongo";
import { generateToken, verifyToken } from "@/lib/server/jwt";
import { User } from "@/models/User";
import { CleanUser } from "@/store/features/auth/authSlice";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper – explicit type for the plain-object returned by .lean()
type LeanUser = {
  _id: any;
  name: string;
  email: string;
  password?: string; // password is only present when we .select("+password")
  photo?: string;
  firstTimeLogin?: boolean;
  isAdmin?: boolean;
  createdAt?: Date;
  expiredAt?: Date;
  history: {
    date: string;
    title: string;
    context: [string, string][];
    generation: string;
  }[];
  paymentType?: string;
  __v?: number;
};

// ==================== AUTH ACTIONS ====================

export async function performLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  await dbConnect();

  // keep Mongoose document + explicitly select password
  const user = await User.findOne({ email }).select("+password");
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password!);
  if (!match) return null;

  // Set expiredAt to 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Properly serialize history to ensure no Mongoose objects leak through
  const serializedHistory = (user.history || []).map((item: any) => ({
    date: item.date,
    title: item.title,
    context: item.context.map((ctx: any) => [ctx[0], ctx[1]]),
    generation: item.generation,
  }));

  const cleanUser: CleanUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    history: serializedHistory, // Use properly serialized history
    paymentType: user.paymentType || "Free One Week",
  };

  const token = await generateToken(cleanUser);

  return { user: cleanUser, token };
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  photo?: string;
}) {
  await dbConnect();

  const { email } = data;

  // lean is fine here – we only need to check existence
  const existingUser = await User.findOne({ email }).lean<LeanUser>();
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const hashed = await bcrypt.hash(data.password, 12);
  // Set expiredAt to 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const user = new User({
    ...data,
    expiredAt,
    password: hashed,
  });
  await user.save();
  return cleanUserForClient(user.toObject());
}

export async function changePhoto(email: string, photo: string) {
  await dbConnect();
  await User.updateOne({ email }, { photo });
  revalidatePath("/profile");
}

export async function updateHistory(
  email: string,
  history: {
    date: string;
    title: string;
    context: [string, string][];
    generation: string;
  }[]
) {
  await dbConnect();
  await User.updateOne({ email }, { history });
}

export async function updatePaymentType(
  email: string,
  paymentType: string,
  expiredAt: Date
) {
  await dbConnect();
  await User.updateOne({ email }, { paymentType, expiredAt });
  revalidatePath("/");
}

export async function updateUser(
  email: string,
  updates: {
    name?: string;
    firstTimeLogin?: boolean;
  }
) {
  await dbConnect();
  await User.updateOne({ email }, { $set: updates });
  revalidatePath("/");
}

export async function findUserByEmail(email: string) {
  await dbConnect();

  // lean + explicit typing – password not needed
  const user = await User.findOne({ email }).lean<LeanUser>();
  if (!user) return null;

  // Set expiredAt to 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Properly serialize history
  const serializedHistory = (user.history || []).map((item: any) => ({
    date: item.date,
    title: item.title,
    context: item.context.map((ctx: any) => [ctx[0], ctx[1]]),
    generation: item.generation,
  }));

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    history: serializedHistory, // Use properly serialized history
    paymentType: user.paymentType,
  };
}

export async function verifyAndChangePassword(
  email: string,
  oldPassword: string,
  newPassword: string
) {
  await dbConnect();

  // need password → keep document + select it
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("USER_NOT_FOUND");

  const match = await bcrypt.compare(oldPassword, user.password!);
  if (!match) throw new Error("INCORRECT_OLD_PASSWORD");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { password: hashed });

  revalidatePath("/profile");
}

// ==================== GOOGLE + JWT ====================

export async function generateJwtForGoogle(user: CleanUser): Promise<string> {
  "use server";
  return await generateToken(user);
}

export async function verifyJwtToken(token: string): Promise<CleanUser | null> {
  "use server";
  return await verifyToken(token);
}

// ==================== LOGOUT ====================

export async function logoutUser() {
  "use server";
  await signOut({ redirect: false });
  redirect("/login");
}
