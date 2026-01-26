import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

export const OTP_EXPIRE_AT_INDEX_NAME = 'expireAt'

const otpSchema = new Schema<env.Otp>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    otp: {
      type: String,
      required: [true, "can't be blank"],
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expireAt: {
      //
      // OTPs are temporary and are deleted automatically after 5 minutes (300 seconds)
      //
      type: Date,
      default: Date.now,
      index: { name: OTP_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: 300, background: true },
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Otp',
  },
)

// Compound index for quick lookups
otpSchema.index({ user: 1, verified: 1, expireAt: 1 })

const Otp = model<env.Otp>('Otp', otpSchema)

export default Otp
