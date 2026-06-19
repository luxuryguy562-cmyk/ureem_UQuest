import { getUser } from "@/lib/uquest-domain";
import { fail, ok, publicUser } from "@/lib/uquest-api";
import { getMutableUQuestConfig } from "@/lib/uquest-repository";
import { verifySession } from "@/lib/uquest-session";

export async function GET(request: Request) {
  try {
    // 서명된 쿠키만 신뢰. 서명이 없거나 틀리면 로그아웃 상태로 취급한다.
    const userId = verifySession(readCookie(request, "uquest_user_id"));
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
