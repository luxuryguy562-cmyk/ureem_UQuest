import { getUser } from "@/lib/uquest-domain";
import { fail, ok, publicUser } from "@/lib/uquest-api";
import { getMutableUQuestConfig } from "@/lib/uquest-repository";

export async function GET(request: Request) {
  try {
    const userId = readCookie(request, "uquest_user_id");
    if (!userId) return ok({ user: null });

    const config = await getMutableUQuestConfig();
    const requester = getUser(config, userId);
    return ok({ user: publicUser(requester) });
  } catch (error) {
    return fail(error);
  }
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const pairs = cookie.split(";").map((item) => item.trim());
  const match = pairs.find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
