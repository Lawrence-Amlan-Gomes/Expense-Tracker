// src/lib/server/jwt.ts
import { SignJWT, jwtVerify } from 'jose';
import { CleanUser } from '@/store/features/auth/authSlice';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in environment');
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function generateToken(user: CleanUser): Promise<string> {
  // Serialize history to ensure it's JSON-safe
  const serializedHistory = user.history.map(item => ({
    date: item.date,
    title: item.title,
    context: item.context.map(([key, value]) => [key, value]),
    generation: item.generation,
  }));

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
    history: serializedHistory, // Use serialized version
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<CleanUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CleanUser;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}