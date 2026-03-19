// backend\src\models\subscription.model.js

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: String,

    planId: String,

    status: {
      type: String,
      enum: ["created", "active", "cancelled", "failed", "expired"],
      default: "created",
    },

    currentStart: Date,
    currentEnd: Date,

    totalCount: Number,
    paidCount: Number,

    amount: Number,

    currency: {
      type: String,
      default: "INR",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Subscription", subscriptionSchema);
