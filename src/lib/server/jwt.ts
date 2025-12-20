// src/lib/server/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { CleanUser } from "@/store/features/auth/authSlice";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Helper to create a plain default routine
const defaultRoutine: IRoutine = {
  saturday: [],
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
};

// Helper to deeply clean routine items (removes any Mongoose-specific properties)
const cleanRoutine = (routine: any): IRoutine => {
  if (!routine) return defaultRoutine;

  return {
    saturday: (routine.saturday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
    sunday: (routine.sunday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
    monday: (routine.monday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
    tuesday: (routine.tuesday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
    wednesday: (routine.wednesday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
    thursday: (routine.thursday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
    friday: (routine.friday || []).map((item: any) => ({
      name: item.name?.toString() || "",
      time: item.time?.toString() || "",
    })),
  };
};

export async function generateToken(user: CleanUser): Promise<string> {
  const plainRoutine = cleanRoutine(user.routine);
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
    routine: plainRoutine, // ← Fully plain, serializable object
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
