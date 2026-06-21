import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string  // bcrypt hash, never the plain text
  credits: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,  // store as lowercase so login is case-insensitive
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
)

// Guard against Mongoose recompiling the model during Next.js hot reload
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
