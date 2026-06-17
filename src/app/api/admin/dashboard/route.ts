import { deriveRookieSummary, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "admin");
    requireRole(requester, ["admin"]);
    const rookies = config.users.filter((user) => user.role === "rookie");
    const active = rookies.filter((user) => user.status === "active");
    const completed = rookies.filter((user) => user.status === "completed");
    const summaries = rookies.map((user) => deriveRookieSummary(config, user));

    return ok({
      totalRookies: rookies.length,
      activeRookies: active.length,
      completedRookies: completed.length,
      pendingApprovals: rookies.filter((user) => user.status === "pending").length,
      couponRequests: config.couponRequests.filter((item) => item.status === "requested").length,
      averageProgressRate: summaries.length ? Math.round(summaries.reduce((sum, item) => sum + item.progressRate, 0) / summaries.length) : 0,
      estimatedPayout: config.pointHistories.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
      notifications: config.notifications
    });
  } catch (error) {
    return fail(error);
  }
}
