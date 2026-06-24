import { ATTENDANCE_LIMIT, deriveRookieSummary, getCurrentCurriculum, getUser, normalizeConfig, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, publicSummary, publicUser, saveConfig } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config: rawConfig, requester: rawRequester } = await getConfigAndRequester(request, "rookie");
    requireRole(rawRequester, ["rookie"]);

    // 30일 자동 수료 적용 후 상태가 바뀐 경우 DB에 즉시 반영
    const config = normalizeConfig(rawConfig);
    const statusChanged = config.users.some((u) => {
      const before = rawConfig.users.find((b) => b.id === u.id);
      return before && before.status !== u.status;
    });
    if (statusChanged) {
      await saveConfig(rawConfig, config);
    }

    const requester = getUser(config, rawRequester.id);
    const summary = deriveRookieSummary(config, requester);
    const todayCurriculum = getCurrentCurriculum(config, requester);

    const myAttendances = config.attendances.filter((item) => item.userId === requester.id);
    const attendanceLimitReached = myAttendances.length >= ATTENDANCE_LIMIT;
    const attendanceDone = attendanceLimitReached || myAttendances.some((item) => item.attendanceDate === config.today);

    return ok({
      today: config.today,
      user: publicUser(requester),
      summary: publicSummary(summary),
      todayCurriculum,
      attendanceDone,
      attendanceLimitReached,
      learningDone: config.learningCompletions.some((item) => item.userId === requester.id && item.curriculumId === todayCurriculum.id),
      quizDone: config.quizSubmissions.some((item) => item.userId === requester.id && item.curriculumId === todayCurriculum.id),
      axDone: config.axSubmissions.some((item) => item.userId === requester.id && item.createdAt.startsWith(config.today))
    });
  } catch (error) {
    return fail(error);
  }
}
