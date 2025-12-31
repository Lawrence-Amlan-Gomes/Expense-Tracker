// src/lib/server/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { CleanUser, IMoney } from "@/store/features/auth/authSlice"; // ← ADD IMoney HERE

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Helper to create a plain default money
const defaultMoney: IMoney = {
  banks: [],
  inCash: 0,
  Months: [],
};

// Helper to deeply clean money items (removes any Mongoose-specific properties)
const cleanMoney = (money: any): IMoney => {
  if (!money) return defaultMoney;

  return {
    banks: (money.banks || []).map((item: any) => ({
      name: item.name?.toString() || "",
      amount: Number(item.amount) || 0,
    })),
    inCash: Number(money.inCash) || 0,
    Months: (money.Months || []).map((month: any) => ({
      name: month.name?.toString() || "",
      spendings: (month.spendings || []).map((spending: any) => ({
        date: spending.date?.toString() || "",
        item: spending.item?.toString() || "",
        cost: Number(spending.cost) || 0,
      })),
    })),
  };
};

export async function generateToken(user: CleanUser): Promise<string> {
  const plainMoney = cleanMoney(user.money);
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    firstTimeLogin: user.firstTimeLogin,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    expiredAt: user.expiredAt,
    paymentType: user.paymentType ?? "Free One Week",
    isEmailVerified: user.isEmailVerified ?? false, // ← NEW
    money: plainMoney, // ← Fully plain, serializable object
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<CleanUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CleanUser;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}