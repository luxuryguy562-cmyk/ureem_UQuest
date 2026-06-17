import { requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, publicUser } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "admin");
    requireRole(requester, ["admin"]);
    return ok({ users: config.users.map(publicUser) });
  } catch (error) {
    return fail(error);
  }
}
