import { certifyAx, requireRole } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, readJson, saveConfig } from "@/lib/uquest-api";
import { uploadAxEvidence } from "@/lib/uquest-repository";

type AxRequest = {
  categoryId: string;
  evidenceName: string;
};

export async function GET(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    requireRole(requester, ["rookie"]);
    return ok({
      submissions: config.axSubmissions.filter((item) => item.userId === requester.id)
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const { config, requester } = await getConfigAndRequester(request, "rookie");
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("multipart/form-data") ? await readMultipartAxRequest(request, requester.id) : await readJson<AxRequest>(request);
    const next = certifyAx(config, requester.id, body.categoryId, body.evidenceName ?? "");
    return ok({ config: await saveConfig(next) });
  } catch (error) {
    return fail(error);
  }
}

async function readMultipartAxRequest(request: Request, userId: string): Promise<AxRequest> {
  const form = await request.formData();
  const categoryId = String(form.get("categoryId") ?? "");
  const file = form.get("evidence");

  if (!(file instanceof File)) {
    return { categoryId, evidenceName: "" };
  }

  return {
    categoryId,
    evidenceName: await uploadAxEvidence(userId, file)
  };
}
