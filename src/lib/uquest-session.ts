import { createHmac, timingSafeEqual } from "crypto";

// 세션 쿠키 서명/검증.
//
// 쿠키 `uquest_user_id` 에는 더 이상 유저 UUID 를 "그대로" 담지 않는다.
// `${userId}.${HMAC-SHA256(secret, userId)}` 형태로 서버 서명을 붙여서,
// 비밀키를 모르면 다른 사람의 쿠키를 위조할 수 없게 한다(위장 차단).
//
// 비밀키는 서버가 이미 가진 `SUPABASE_SERVICE_ROLE_KEY` 를 재사용한다.
// → 운영자가 새 비밀키를 등록할 필요가 없다. 키가 없는 로컬/목업 개발에서만
//   고정 개발 키로 대체하고, 프로덕션에서 키가 없으면 fail-closed 로 차단한다.

export const SESSION_COOKIE_NAME = "uquest_user_id";

function getSessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET_MISSING: SUPABASE_SERVICE_ROLE_KEY가 없어 세션을 서명할 수 없습니다.");
  }
  // 로컬/목업 개발 전용. 프로덕션은 위에서 이미 throw 되므로 여기까지 오지 않는다.
  return "uquest-dev-only-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

// 로그인/회원가입 성공 시 쿠키에 담을 서명된 토큰을 만든다.
export function signSession(userId: string) {
  return `${userId}.${sign(userId)}`;
}

// 쿠키 토큰을 검증해 userId 를 돌려준다. 서명이 없거나 틀리면(옛 쿠키·위조) null.
export function verifySession(token: string | null | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const userId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(userId);

  // 길이가 다르면 timingSafeEqual 이 throw 하므로 먼저 막는다.
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  return userId;
}
