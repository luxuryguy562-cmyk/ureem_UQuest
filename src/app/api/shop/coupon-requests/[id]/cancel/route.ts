import { cancelCouponRequest } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

type CancelBody = {
  reason?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    const body = await readJson<CancelBody>(request);
    const next = cancelCouponRequest(config, requester.id, id, body.reason ?? "사용자 요청");
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
