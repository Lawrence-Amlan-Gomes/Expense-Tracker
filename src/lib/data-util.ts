// src/lib/data-util.ts
export const cleanUserForClient = (user: any) => {
  if (!user) return null;
  // Set expiredAt to 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Helper to clean routine items
  const cleanRoutine = (routine: any) => {
    if (!routine) {
      return { saturday: [], sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };
    }
    return {
      saturday: routine.saturday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
      sunday: routine.sunday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
      monday: routine.monday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
      tuesday: routine.tuesday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
      wednesday: routine.wednesday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
      thursday: routine.thursday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
      friday: routine.friday?.map((i: any) => ({ name: i.name, time: i.time })) || [],
    };
  };

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
    paymentType: user.paymentType || "Free One Week", // ← add fallback if needed
    isEmailVerified: user.isEmailVerified ?? false,
    routine: cleanRoutine(user.routine), // ← Cleaned properly
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
