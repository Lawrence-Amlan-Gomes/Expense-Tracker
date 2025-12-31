// src/lib/data-util.ts
export const cleanUserForClient = (user: any) => {
  if (!user) return null;
  // Set expiredAt to 7 days from now if not present
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  // Helper to clean money object
  const cleanMoney = (money: any) => {
    if (!money) {
      return {
        banks: [],
        inCash: 0,
        Months: [],
      };
    }

    return {
      banks: (money.banks || []).map((item: any) => ({
        name: item.name || "",
        amount: Number(item.amount) || 0,
      })),
      inCash: Number(money.inCash) || 0,
      Months: (money.Months || []).map((month: any) => ({
        name: month.name || "",
        spendings: (month.spendings || []).map((spending: any) => ({
          date: spending.date || "",
          item: spending.item || "",
          cost: Number(spending.cost) || 0,
        })),
      })),
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
    paymentType: user.paymentType || "Free One Week",
    isEmailVerified: user.isEmailVerified ?? false,
    money: cleanMoney(user.money), // ← Now returns cleaned money structure
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