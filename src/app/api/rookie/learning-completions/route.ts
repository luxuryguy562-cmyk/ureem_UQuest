import { completeLearning, getCurrentCurriculum, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";

type LearningRequest = {
  curriculumId?: string;
};

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    const body = await readJson<LearningRequest>(request);
    const curriculumId = body.curriculumId ?? getCurrentCurriculum(config, requester).id;
    const next = completeLearning(config, requester.id, curriculumId);
    return ok({ config: await saveConfig(next) });
  } catch (error) {
    return fail(error);
  }
}
