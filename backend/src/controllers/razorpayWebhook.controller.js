// backend/src/controllers/razorpayWebhook.controller.js

import crypto from "crypto";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // ✅ RAW BUFFER
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    const subId =
      event.payload?.subscription?.entity?.id ||
      event.payload?.invoice?.entity?.subscription_id;

    if (!subId) return res.json({ ok: true });

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: subId,
    });

    if (!subscription) return res.json({ ok: true });

    switch (event.event) {
      case "subscription.activated":
        await Subscription.updateOne(
          { _id: subscription._id },
          { status: "active" },
        );

        await User.findByIdAndUpdate(subscription.user, {
          subscriptionStatus: "active",
        });
        break;

      case "subscription.cancelled":
        await Subscription.updateOne(
          { _id: subscription._id },
          { status: "cancelled" },
        );

        await User.findByIdAndUpdate(subscription.user, {
          subscriptionStatus: "cancelled",
        });
        break;

      case "invoice.paid":
        await Subscription.updateOne(
          { _id: subscription._id },
          {
            status: "active",
            $inc: { paidCount: 1 },
            currentEnd: new Date(Date.now() + 30 * 86400000),
          },
        );

        await User.findByIdAndUpdate(subscription.user, {
          subscriptionStatus: "active",
          expiresAt: new Date(Date.now() + 30 * 86400000),
        });
        break;

      case "invoice.payment_failed":
        await Subscription.updateOne(
          { _id: subscription._id },
          { status: "failed" },
        );

        await User.findByIdAndUpdate(subscription.user, {
          subscriptionStatus: "failed",
        });
        break;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send("Webhook error");
  }
};
