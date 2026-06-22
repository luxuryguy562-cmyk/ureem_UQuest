import { createCoupon, type CouponInput } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "admin");
    const body = await readJson<CouponInput>(request);
    const next = createCoupon(config, requester.id, body);
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
