import { requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    return ok({
      histories: config.pointHistories.filter((item) => item.userId === requester.id)
    });
  } catch (error) {
    return fail(error);
  }
}
