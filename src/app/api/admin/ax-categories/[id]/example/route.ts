import { updateAxCategoryExample } from "@/lib/uquest-domain";
import { fail, getConfigAndRequester, ok, saveConfig } from "@/lib/uquest-api";
import { uploadAxEvidence } from "@/lib/uquest-repository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { config, requester } = await getConfigAndRequester(request, "admin");
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return fail(new Error("이미지 파일이 필요합니다."));
    }

    const imageUrl = await uploadAxEvidence(`ax-example/${id}`, file);
    const next = updateAxCategoryExample(config, requester.id, id, imageUrl);
    return ok({ config: await saveConfig(config, next) });
  } catch (error) {
    return fail(error);
  }
}
