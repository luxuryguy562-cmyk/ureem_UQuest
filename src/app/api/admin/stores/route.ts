import { importStores, type StoreImportInput } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "admin");
    const body = await readJson<StoreImportInput>(request);
    const next = importStores(config, requester.id, body);
    return ok({ config: await saveConfig(next) });
  } catch (error) {
    return fail(error);
  }
}
