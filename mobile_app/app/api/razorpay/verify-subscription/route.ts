// mobile_app\app\api\razorpay\verify-subscription\route.ts

import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  } = body;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return NextResponse.json(
      { success: false },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}