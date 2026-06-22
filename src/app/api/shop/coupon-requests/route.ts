import { redeemCoupon, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

type CouponRequestBody = {
  couponId: string;
};

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    return ok({
      requests: config.couponRequests.filter((item) => item.userId === requester.id).map((item) => ({
        ...item,
        expired: Boolean(item.expiresAt && config.today > item.expiresAt.slice(0, 10))
      }))
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    const body = await readJson<CouponRequestBody>(request);
    const next = redeemCoupon(config, requester.id, body.couponId);
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
