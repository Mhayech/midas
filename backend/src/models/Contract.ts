import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'

const contractSchema = new Schema<bookcarsTypes.Contract>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Booking',
    },
    contractNumber: {
      type: String,
      required: [true, "can't be blank"],
      unique: true,
    },
    fileName: {
      type: String,
      required: [true, "can't be blank"],
    },
    filePath: {
      type: String,
      required: [true, "can't be blank"],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    customer: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
    },
    supplier: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Contract',
  },
)

// Create indexes for queries (booking index already created automatically)
contractSchema.index({ customer: 1 })
contractSchema.index({ supplier: 1 })
contractSchema.index({ generatedAt: -1 })

const Contract = model<bookcarsTypes.Contract>('Contract', contractSchema)

export default Contract
