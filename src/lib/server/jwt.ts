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

// Type narrowing helpers
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function toSafeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
  if (isObject(value) && 'toString' in value && typeof value.toString === 'function') {
    return value.toString();
  }
  return "";
}

// Helper to deeply clean money items (removes any Mongoose-specific properties)
const cleanMoney = (money: unknown): IMoney => {
  if (!money) return defaultMoney;
  if (!isObject(money)) return defaultMoney;

  return {
    banks: (isArray(money.banks) ? money.banks : []).map((item: unknown) => {
      if (!isObject(item)) return { name: "", amount: 0 };
      return {
        name: toSafeString(item.name),
        amount: Number(item.amount) || 0,
      };
    }),
    inCash: Number(money.inCash) || 0,
    Months: (isArray(money.Months) ? money.Months : []).map((month: unknown) => {
      if (!isObject(month)) return { name: "", spendings: [] };
      return {
        name: toSafeString(month.name),
        spendings: (isArray(month.spendings) ? month.spendings : []).map((spending: unknown) => {
          if (!isObject(spending)) return { date: "", item: "", cost: 0 };
          return {
            date: toSafeString(spending.date),
            item: toSafeString(spending.item),
            cost: Number(spending.cost) || 0,
          };
        }),
      };
    }),
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