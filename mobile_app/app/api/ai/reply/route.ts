// mobile_app\app\api\ai\reply\route.ts

import { generateReviewReply } from "@/lib/aiService";

export async function POST(req: Request) {
  try {
    const { review, rating, reviewerName, businessName, tone } =
      await req.json();

    // ⭐ Handle reviews without text
    if (!review || review.trim() === "") {
      const genericReply = `
        Hi ${reviewerName?.split(" ")[0] || "there"},

        Thank you for taking the time to leave a rating for ${businessName || "our business"}.
        We truly appreciate your support and are glad you chose us.

        We look forward to welcoming you again.

        Best Regards,
        ${businessName || "Our Business"} Team
        `.trim();

      return Response.json({
        success: true,
        reply: genericReply,
      });
    }

    const reply = await generateReviewReply(
      review,
      rating,
      reviewerName,
      businessName,
      tone,
    );

    return Response.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message || "AI generation failed",
      },
      { status: 500 },
    );
  }
}
