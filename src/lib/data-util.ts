// src/lib/data-util.ts
export const cleanUserForClient = (user: any) => {
  if (!user) return null;
  // Set expiredAt to 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  return {
    id: user._id?.toString() || user.id,
    name: user.name || "User",
    email: user.email,
    photo: user.photo || "",
    firstTimeLogin: user.firstTimeLogin ?? true,
    isAdmin: user.isAdmin || false,
    createdAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : new Date().toISOString(),
    expiredAt: user.expiredAt?.toISOString() || expiredAt.toISOString(),
  };
};

export const cleanGoogleUserForClient = (googleUser: any) => {
  if (!googleUser) return null;

  return {
    name: googleUser.name || "Google User",
    email: googleUser.email,
    image: googleUser.picture || googleUser.image || "",
  };
};
