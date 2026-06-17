import { requireRole, submitQuiz } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

type QuizRequest = {
  curriculumId: string;
  answers: Record<string, number>;
};

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    return ok({
      submissions: config.quizSubmissions.filter((item) => item.userId === requester.id)
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    const body = await readJson<QuizRequest>(request);
    const next = submitQuiz(config, requester.id, body.curriculumId, body.answers ?? {});
    return ok({ config: await saveConfig(next) });
  } catch (error) {
    return fail(error);
  }
}
