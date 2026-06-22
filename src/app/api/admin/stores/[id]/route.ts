import { updateStore, type StoreUpdateInput } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { config, requester } = await getConfigAndRequester(request, "admin");
    const body = await readJson<StoreUpdateInput>(request);
    const next = updateStore(config, requester.id, id, body);
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
