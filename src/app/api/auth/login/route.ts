import { NextResponse } from "next/server";

import { findLoginUser } from "@/lib/uquest-auth";
import { publicUser, readJson } from "@/lib/uquest-api";
import { getMutableUQuestConfig } from "@/lib/uquest-repository";

type LoginBody = {
  loginId: string;
  password: string;
};

export async function POST(request: Request) {
  const config = await getMutableUQuestConfig();
  const body = await readJson<LoginBody>(request);
  const user = findLoginUser(config, body.loginId ?? "", body.password ?? "");

  if (!user) {
    return NextResponse.json({ error: "INVALID_LOGIN", message: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ user: publicUser(user), status: user.status });
  response.cookies.set("uquest_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  response.cookies.set("uquest_user_role", user.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}
