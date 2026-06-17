import { rejectUser } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

type RejectBody = {
  reason?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { config, requester } = await getConfigAndRequester(request, "admin");
    const body = await readJson<RejectBody>(request);
    const next = rejectUser(config, requester.id, id, body.reason ?? "관리자 확인 필요");
    return ok({ config: await saveConfig(next) });
  } catch (error) {
    return fail(error);
  }
}
