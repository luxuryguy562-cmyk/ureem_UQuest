import { UQuestApp } from "@/components/uquest/uquest-app";
import { getUQuestAppConfig } from "@/lib/uquest-repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  const config = await getUQuestAppConfig();

  return <UQuestApp config={config} />;
}
