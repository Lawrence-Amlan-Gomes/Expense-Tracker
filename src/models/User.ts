// src/models/User.ts
import mongoose from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  photo?: string;
  firstTimeLogin: boolean;
  createdAt: Date;
  expiredAt: Date;
  history: {
    date: string;
    title: string;
    context: [string, string][];
    generation: string;
  }[];
  isAdmin: boolean;
  paymentType: string; // ← ADDED: This line was missing!
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    photo: { type: String, default: "" },
    firstTimeLogin: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    expiredAt: { type: Date },
    history: {type: Array, default: []},
    isAdmin: { type: Boolean, default: false},
    paymentType: { type: String, default: "Free One Week" }, // ← Now valid because type exists above
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const User = mongoose.models.users || mongoose.model<IUser>("users", UserSchema);