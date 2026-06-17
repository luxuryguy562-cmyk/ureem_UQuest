import { deriveRookieSummary, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, publicSummary, publicUser } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    const summary = deriveRookieSummary(config, requester);
    const badges = config.badges.filter((badge) => requester.badgeIds.includes(badge.id));
    return ok({ user: publicUser(requester), summary: publicSummary(summary), badges });
  } catch (error) {
    return fail(error);
  }
}
