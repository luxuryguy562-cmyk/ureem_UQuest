import { claimAttendance, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, saveConfig } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    return ok({
      attendances: config.attendances.filter((item) => item.userId === requester.id)
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    const next = claimAttendance(config, requester.id);
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
