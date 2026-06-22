import { sendCouponRequest } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, saveConfig } from "@/lib/uquest-api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { config, requester } = await getConfigAndRequester(request, "admin");
    const next = sendCouponRequest(config, requester.id, id);
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
