import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'

const carStateSchema = new Schema<bookcarsTypes.CarStateInfo>(
  {
    car: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'Car',
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    stateType: {
      type: String,
      enum: [
        bookcarsTypes.CarState.PreRental,    // Before customer picks up
        bookcarsTypes.CarState.PostRental,   // After customer returns
        bookcarsTypes.CarState.Maintenance,  // Service/repair state
        bookcarsTypes.CarState.Damaged,      // Damage assessment
        bookcarsTypes.CarState.Cleaning,     // Cleaning required
        bookcarsTypes.CarState.OutOfService, // Out of service
      ],
      required: [true, "can't be blank"],
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, "can't be blank"],
    },
    date: {
      type: Date,
      required: [true, "can't be blank"],
      index: true,
    },
    time: {
      type: String,
      required: [true, "can't be blank"],
    },
    mileage: {
      type: Number,
      required: [true, "can't be blank"],
      min: 0,
    },
    fuelLevel: {
      type: Number,
      required: [true, "can't be blank"],
      min: 0,
      max: 100,
    },
    bodyCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      required: [true, "can't be blank"],
    },
    interiorCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      required: [true, "can't be blank"],
    },
    damages: [{
      id: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['W', 'P', 'O', 'T', 'R'], // W=Dent, P=Crack, O=Chip, T=Scratch, R=Scuff
        required: true,
      },
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'critical'],
        required: true,
      },
      viewAngle: {
        type: String,
        enum: ['front', 'back', 'left', 'right', 'top', 'interior'],
        required: true,
      },
      x: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      y: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      isNewDamage: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    }],
    includedItems: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      isPresent: {
        type: Boolean,
        required: true,
      },
      condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'missing'],
        required: true,
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
    photos: [{
      url: {
        type: String,
        required: true,
      },
      caption: {
        type: String,
        trim: true,
      },
      viewAngle: {
        type: String,
        enum: ['front', 'back', 'left', 'right', 'top', 'interior'],
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    }],
    adminNotes: {
      type: String,
      trim: true,
    },
    customerNotes: {
      type: String,
      trim: true,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "can't be blank"],
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
      default: 'draft',
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    previousState: {
      type: Schema.Types.ObjectId,
      ref: 'CarState',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
carStateSchema.index({ car: 1, date: -1 })
// Note: booking index is already created via 'index: true' in schema field
carStateSchema.index({ stateType: 1, date: -1 })
carStateSchema.index({ location: 1, date: -1 })
carStateSchema.index({ admin: 1, createdAt: -1 })
carStateSchema.index({ status: 1, createdAt: -1 })

export default model<bookcarsTypes.CarStateInfo>('CarState', carStateSchema)


