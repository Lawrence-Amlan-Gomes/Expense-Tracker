// src/lib/data-util.ts

interface BankAccount {
  name: string;
  amount: number;
}

interface Spending {
  date: string;
  item: string;
  cost: number;
}

interface MoneyMonth {
  name: string;
  spendings: Spending[];
}

interface Money {
  banks: BankAccount[];
  inCash: number;
  Months: MoneyMonth[];
  categories: string[];
}

interface IncomeEntry {
  year: number;
  month: string;
  amount: number;
  source: string;
}

interface ClientUser {
  id: string;
  name: string;
  email: string | undefined;
  photo: string;
  firstTimeLogin: boolean;
  isAdmin: boolean;
  createdAt: string;
  expiredAt: string;
  paymentType: string;
  isEmailVerified: boolean;
  money: Money;
  income: IncomeEntry[];
  incomeSources: string[];
}

// Type guard helpers
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

function getString(obj: unknown, key: string, defaultValue = ''): string {
  if (isRecord(obj) && typeof obj[key] === 'string') {
    return obj[key] as string;
  }
  return defaultValue;
}

function getNumber(obj: unknown, key: string, defaultValue = 0): number {
  if (isRecord(obj) && (typeof obj[key] === 'number' || typeof obj[key] === 'string')) {
    const num = Number(obj[key]);
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
}

function getBoolean(obj: unknown, key: string, defaultValue = false): boolean {
  if (isRecord(obj)) {
    const val = obj[key];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
  }
  return defaultValue;
}

export const cleanUserForClient = (user: unknown): ClientUser | null => {
  if (!isRecord(user)) return null;

  // Default expiredAt: 7 days from now
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const cleanMoney = (money: unknown): Money => {
    if (!isRecord(money)) {
      return {
        banks: [],
        inCash: 0,
        Months: [],
        categories: [],
      };
    }

    // banks
    const banks: BankAccount[] = [];
    const rawBanks = money.banks;
    if (isArray(rawBanks)) {
      for (const item of rawBanks) {
        if (isRecord(item)) {
          banks.push({
            name: getString(item, 'name'),
            amount: getNumber(item, 'amount'),
          });
        }
      }
    }

    // inCash
    const inCash = getNumber(money, 'inCash');

    // Months
    const Months: MoneyMonth[] = [];
    const rawMonths = money.Months;
    if (isArray(rawMonths)) {
      for (const month of rawMonths) {
        if (!isRecord(month)) continue;

        const spendings: Spending[] = [];
        const rawSpendings = month.spendings;

        if (isArray(rawSpendings)) {
          for (const s of rawSpendings) {
            if (isRecord(s)) {
              spendings.push({
                date: getString(s, 'date'),
                item: getString(s, 'item'),
                cost: getNumber(s, 'cost'),
              });
            }
          }
        }

        Months.push({
          name: getString(month, 'name'),
          spendings,
        });
      }
    }

    const categories: string[] = [];
    const rawCategories = money.categories;
    if (isArray(rawCategories)) {
      for (const c of rawCategories) {
        if (typeof c === "string") categories.push(c);
      }
    }

    return { banks, inCash, Months, categories };
  };

  const id = user._id
    ? String(user._id)
    : getString(user, 'id', '');

  const cleanIncome = (income: unknown): IncomeEntry[] => {
    if (!isArray(income)) return [];
    const result: IncomeEntry[] = [];
    for (const item of income) {
      if (!isRecord(item)) continue;
      const year = getNumber(item, 'year');
      const month = getString(item, 'month');
      const amount = getNumber(item, 'amount');
      const source = getString(item, 'source');
      if (year > 0 && month) result.push({ year, month, amount, source });
    }
    return result;
  };

  const cleanIncomeSources = (sources: unknown): string[] => {
    if (!isArray(sources)) return [];
    const result: string[] = [];
    for (const s of sources) {
      if (typeof s === 'string') result.push(s);
    }
    return result;
  };

  return {
    id,
    name: getString(user, 'name', 'User'),
    email: typeof user.email === 'string' ? user.email : undefined,
    photo: getString(user, 'photo'),
    firstTimeLogin: getBoolean(user, 'firstTimeLogin', true),
    isAdmin: getBoolean(user, 'isAdmin', false),
    createdAt: user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : new Date().toISOString(),
    expiredAt: user.expiredAt instanceof Date
      ? user.expiredAt.toISOString()
      : expiredAt.toISOString(),
    paymentType: getString(user, 'paymentType', 'Free One Week'),
    isEmailVerified: getBoolean(user, 'isEmailVerified', false),
    money: cleanMoney(user.money),
    income: cleanIncome(user.income),
    incomeSources: cleanIncomeSources(user.incomeSources),
  };
};

export const cleanGoogleUserForClient = (googleUser: unknown) => {
  if (!isRecord(googleUser)) return null;

  return {
    name: getString(googleUser, 'name', 'Google User'),
    email: typeof googleUser.email === 'string' ? googleUser.email : undefined,
    image: getString(googleUser, 'picture') || getString(googleUser, 'image'),
  };
};