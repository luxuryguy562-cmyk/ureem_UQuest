import { deriveRookieSummary, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, publicSummary, publicUser } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "manager");
    requireRole(requester, ["manager"]);
    const rookies = config.users
      .filter((user) => user.role === "rookie" && user.storeId === requester.storeId)
      .map((user) => ({
        user: publicUser(user),
        summary: publicSummary(deriveRookieSummary(config, user)),
        badges: config.badges.filter((badge) => user.badgeIds.includes(badge.id))
      }));

    return ok({ rookies });
  } catch (error) {
    return fail(error);
  }
}
