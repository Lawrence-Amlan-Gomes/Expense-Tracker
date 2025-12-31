// src/app/actions.ts
"use server";

import { signOut } from "@/app/auth";
import { cleanUserForClient } from "@/lib/data-util";
import { CleanUser, IMoney } from "@/store/features/auth/authSlice";
import { dbConnect } from "@/lib/mongo";
import {
  sendVerificationEmail,
  sendVerificationSuccessEmail,
} from "@/lib/server/email"; // ← UPDATED
import { generateToken, verifyToken } from "@/lib/server/jwt";
import { User } from "@/models/User";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type LeanUser = {
  _id: any;
  name: string;
  email: string;
  password?: string;
  photo?: string;
  firstTimeLogin?: boolean;
  isAdmin?: boolean;
  createdAt?: Date;
  expiredAt?: Date;
  paymentType?: string;
  isEmailVerified?: boolean;
  money?: {
    banks: { name: string; amount: number }[];
    inCash: number;
    Months: { name: string; spendings: { date: string; item: string; cost: number }[] }[];
  };
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

  const user = await User.findOne({ email }).select("+password");
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password!);
  if (!match) return null;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const cleanUser: CleanUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType || "Free One Week",
    isEmailVerified: user.isEmailVerified || false,
    money: user.money
      ? {
          banks: user.money.banks.map(
            (item: { name: string; amount: number }) => ({
              name: item.name,
              amount: item.amount,
            })
          ),
          inCash: user.money.inCash,
          Months: user.money.Months.map(
            (month: { name: string; spendings: { date: string; item: string; cost: number }[] }) => ({
              name: month.name,
              spendings: month.spendings.map(
                (spending: { date: string; item: string; cost: number }) => ({
                  date: spending.date,
                  item: spending.item,
                  cost: spending.cost,
                })
              ),
            })
          ),
        }
      : {
          banks: [],
          inCash: 0,
          Months: [],
        },
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

  const existingUser = await User.findOne({ email }).lean<LeanUser>();
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const hashed = await bcrypt.hash(data.password, 12);
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Check if it's Google registration (no password means Google)
  const isGoogleAuth = !data.password || data.password === "";

  const user = new User({
    ...data,
    expiredAt,
    password: hashed,
    isEmailVerified: isGoogleAuth, // ← true for Google, false for manual
    // money will use schema default, but explicitly setting is safer
    money: {
      banks: [],
      inCash: 0,
      Months: [],
    },
  });

  await user.save();

  // ← NEW: Send verification email only for manual registration
  if (!isGoogleAuth) {
    const verificationLink = `${
      process.env.NEXTAUTH_URL
    }/api/verify-email?email=${encodeURIComponent(email)}`;
    await sendVerificationEmail(email, verificationLink, data.name);
  }

  return cleanUserForClient(user.toObject());
}

// ← UPDATED: Verify email function with success email
export async function verifyUserEmail(email: string) {
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.isEmailVerified) {
    return { success: false, error: "Email already verified" };
  }

  // Update MongoDB
  await User.updateOne({ email }, { isEmailVerified: true });

  // Send success email
  await sendVerificationSuccessEmail(email, user.name);

  return { success: true, message: "Email verified successfully!" };
}

export async function resendVerificationEmail(email: string, name: string) {
  "use server";

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.isEmailVerified) {
    return { success: false, error: "Email already verified" };
  }

  const verificationLink = `${
    process.env.NEXTAUTH_URL
  }/api/verify-email?email=${encodeURIComponent(email)}`;

  await sendVerificationEmail(email, verificationLink, name);

  return { success: true };
}

export async function checkEmailVerificationStatus(email: string) {
  "use server";

  await dbConnect();

  const user = await User.findOne({ email }).select("isEmailVerified");
  if (!user) {
    return { success: false, isEmailVerified: false };
  }

  return { success: true, isEmailVerified: user.isEmailVerified };
}

export async function changePhoto(email: string, photo: string) {
  await dbConnect();
  await User.updateOne({ email }, { photo });
  revalidatePath("/profile");
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

  const user = await User.findOne({ email }).lean<LeanUser>();
  if (!user) return null;

  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin || false,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
    paymentType: user.paymentType,
    isEmailVerified: user.isEmailVerified || false, // ← NEW
    money: user.money
      ? {
          banks: user.money.banks.map(
            (item: { name: string; amount: number }) => ({
              name: item.name,
              amount: item.amount,
            })
          ),
          inCash: user.money.inCash,
          Months: user.money.Months.map(
            (month: { name: string; spendings: { date: string; item: string; cost: number }[] }) => ({
              name: month.name,
              spendings: month.spendings.map(
                (spending: { date: string; item: string; cost: number }) => ({
                  date: spending.date,
                  item: spending.item,
                  cost: spending.cost,
                })
              ),
            })
          ),
        }
      : {
          banks: [],
          inCash: 0,
          Months: [],
        },
  };
}

export async function verifyAndChangePassword(
  email: string,
  oldPassword: string,
  newPassword: string
) {
  await dbConnect();

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("USER_NOT_FOUND");

  const match = await bcrypt.compare(oldPassword, user.password!);
  if (!match) throw new Error("INCORRECT_OLD_PASSWORD");

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ email }, { password: hashed });

  revalidatePath("/profile");
}

// Add to src/app/actions.ts
export async function updateMoney(email: string, money: IMoney) {
  await dbConnect();
  await User.updateOne({ email }, { money });
  revalidatePath("/dashBoard"); // or wherever your money page is
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