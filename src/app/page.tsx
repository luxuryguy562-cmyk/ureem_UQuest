import { cookies } from "next/headers";

import { UQuestApp } from "@/components/uquest/uquest-app";
import { getUQuestAppConfig } from "@/lib/uquest-repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("uquest_user_id")?.value;
  const userRole = cookieStore.get("uquest_user_role")?.value;
  const config = await getUQuestAppConfig(userId, userRole === "rookie");

  return <UQuestApp config={config} />;
}
