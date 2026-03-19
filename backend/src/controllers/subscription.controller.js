// backend/src/controllers/subscription.controller.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =========================================
   CREATE SUBSCRIPTION
========================================= */
export const createSubscription = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: "Plan ID required" });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
    });

    res.json({ subscriptionId: subscription.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create subscription" });
  }
};

/* =========================================
   VERIFY PAYMENT + SAVE
========================================= */
export const verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      planId,
    } = req.body;

    const userId = req.user.id;

    // 🔐 verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    // ❌ prevent duplicate subscription
    const existing = await Subscription.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
    });

    if (existing) {
      return res.json({ success: true });
    }

    const expiry = new Date(Date.now() + 30 * 86400000);

    // ✅ create subscription
    const subscription = await Subscription.create({
      user: userId,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayPaymentId: razorpay_payment_id,
      planId,
      status: "active",
      currentStart: new Date(),
      currentEnd: expiry,
      paidCount: 1,
      amount: 499,
    });

    // ✅ update user
    await User.findByIdAndUpdate(userId, {
      subscription: subscription._id,
      subscriptionStatus: "active",
      plan: planId || "starter",
      expiresAt: expiry,
    });

    return res.json({
      success: true,
      subscriptionId: razorpay_subscription_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

/* =========================================
   GET USER SUBSCRIPTION
========================================= */
export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(subscription);
  } catch (err) {
    res.status(500).json({ message: "Error fetching subscription" });
  }
};

/* =========================================
   CANCEL SUBSCRIPTION
========================================= */
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    await razorpay.subscriptions.cancel(subscriptionId);

    const sub = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionId },
      { status: "cancelled" },
      { new: true },
    );

    if (sub) {
      await User.findByIdAndUpdate(sub.user, {
        subscriptionStatus: "cancelled",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancel failed" });
  }
};
