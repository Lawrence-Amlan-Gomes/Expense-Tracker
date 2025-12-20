// src/models/User.ts
import mongoose, { Document } from "mongoose";

export interface IRoutineItem {
  name: string;
  time: string;
}

export interface IRoutine {
  saturday: IRoutineItem[];
  sunday: IRoutineItem[];
  monday: IRoutineItem[];
  tuesday: IRoutineItem[];
  wednesday: IRoutineItem[];
  thursday: IRoutineItem[];
  friday: IRoutineItem[];
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
  routine: IRoutine;
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
    routine: {
      type: {
        saturday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        sunday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        monday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        tuesday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        wednesday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        thursday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
            },
          ],
          default: [],
          _id: false,
        },
        friday: {
          type: [
            {
              name: { type: String, required: true, trim: true },
              time: { type: String, required: true, trim: true },
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
