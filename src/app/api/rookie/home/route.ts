import { deriveRookieSummary, getCurrentCurriculum, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, publicSummary, publicUser } from "@/lib/uquest-api";

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    const summary = deriveRookieSummary(config, requester);
    const todayCurriculum = getCurrentCurriculum(config, requester);

    return ok({
      today: config.today,
      user: publicUser(requester),
      summary: publicSummary(summary),
      todayCurriculum,
      attendanceDone: config.attendances.some((item) => item.userId === requester.id && item.attendanceDate === config.today),
      learningDone: config.learningCompletions.some((item) => item.userId === requester.id && item.curriculumId === todayCurriculum.id),
      quizDone: config.quizSubmissions.some((item) => item.userId === requester.id && item.curriculumId === todayCurriculum.id),
      axDone: config.axSubmissions.some((item) => item.userId === requester.id && item.createdAt.startsWith(config.today))
    });
  } catch (error) {
    return fail(error);
  }
}
