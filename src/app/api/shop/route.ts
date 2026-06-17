import { deriveRookieSummary, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    return ok({
      shop: {
        opened: requester.status === "completed",
        pointExpired: deriveRookieSummary(config, requester).pointExpired
      },
      coupons: config.coupons.filter((coupon) => coupon.isPublished)
    });
  } catch (error) {
    return fail(error);
  }
}
