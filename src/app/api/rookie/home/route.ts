import { ATTENDANCE_LIMIT, deriveRookieSummary, getCurrentCurriculum, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, publicSummary, publicUser } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
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
