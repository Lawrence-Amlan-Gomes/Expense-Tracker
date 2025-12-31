// src/models/User.ts
import mongoose, { Document } from "mongoose";

export interface IBank {
  name: string;
  amount: number;
}

export interface ISpending {
  date: string;
  item: string;
  cost: number;
}

export interface IMonth {
  name: string;
  spendings: ISpending[];
}

export interface IMoney {
  banks: IBank[];
  inCash: number;
  Months: IMonth[];
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  photo?: string;
  firstTimeLogin: boolean;
  createdAt: Date;
  expiredAt?: Date;
  isAdmin: boolean;
  paymentType: string;
  isEmailVerified: boolean;
  money: IMoney;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    photo: { type: String, default: "" },
    firstTimeLogin: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    expiredAt: { type: Date },
    isAdmin: { type: Boolean, default: false },
    paymentType: { type: String, default: "Free One Week" },
    isEmailVerified: { type: Boolean, default: false },
    money: {
      type: {
        banks: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              amount: { type: Number, required: true },
            },
          ],
          default: [],
          _id: false,
        },
        inCash: { type: Number, default: 0 },
        Months: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              spendings: {
                type: [
                  {
                    date: { type: String, required: true, trim: true },
                    item: { type: String, required: true, trim: true },
                    cost: { type: Number, required: true },
                  },
                ],
                default: [],
                _id: false,
              },
            },
          ],
          default: [],
          _id: false,
        },
      },
      default: {},
      _id: false,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const User =
  mongoose.models.users || mongoose.model<IUser>("users", UserSchema);