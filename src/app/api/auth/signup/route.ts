import { NextResponse } from "next/server";

import { createSignupUser } from "@/lib/uquest-auth";
import { signSession } from "@/lib/uquest-session";
import { fail, publicUser, readJson, saveConfig } from "@/lib/uquest-api";
import { getMutableUQuestConfig } from "@/lib/uquest-repository";

type SignupBody = {
  name: string;
  phone: string;
  loginId: string;
  password: string;
  storeId: string;
  hireDate: string;
  avatarGender?: "male" | "female";
};

export async function POST(request: Request) {
  try {
    const config = await getMutableUQuestConfig();
    const body = await readJson<SignupBody>(request);
    const next = createSignupUser(config, body);
    const saved = await saveConfig(next);
    const user = saved.users[saved.users.length - 1];
    const response = NextResponse.json({ user: publicUser(user), status: "pending" });
    response.cookies.set("uquest_user_id", signSession(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
    return response;
  } catch (error) {
    return failAuth(error);
  }
}

function failAuth(error: unknown) {
  if (!(error instanceof Error)) return fail(error);

  const messages: Record<string, string> = {
    NAME_REQUIRED: "이름을 입력해야 합니다.",
    PHONE_REQUIRED: "휴대폰번호를 입력해야 합니다.",
    LOGIN_ID_REQUIRED: "아이디를 입력해야 합니다.",
    PASSWORD_TOO_SHORT: "비밀번호는 6자 이상이어야 합니다.",
    STORE_NOT_FOUND: "선택한 매장을 찾을 수 없습니다.",
    LOGIN_ID_DUPLICATED: "이미 사용 중인 아이디입니다."
  };

  return NextResponse.json({ error: error.message, message: messages[error.message] ?? "회원가입에 실패했습니다." }, { status: 400 });
}
