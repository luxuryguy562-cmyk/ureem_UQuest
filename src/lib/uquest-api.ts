import { NextResponse } from "next/server";

import { UQuestDomainError, getUser, isUQuestDomainError, type RookieSummary } from "@/lib/uquest-domain";
import { getMutableUQuestConfig, saveMutableUQuestConfig } from "@/lib/uquest-repository";
import type { FinalUQuestConfig, FinalUser } from "@/types/uquest";

export type UQuestRequesterKind = "rookie" | "manager" | "admin";

export async function getConfigAndRequester(request: Request, kind: UQuestRequesterKind) {
  const config = await getMutableUQuestConfig();
  const userId = getRequesterId(request, config, kind);
  const requester = getUser(config, userId);

  return { config, requester };
}

export async function saveConfig(before: FinalUQuestConfig, next: FinalUQuestConfig) {
  return saveMutableUQuestConfig(before, next);
}

export function ok(payload: unknown = {}) {
  return NextResponse.json(payload);
}

export function fail(error: unknown) {
  if (isUQuestDomainError(error)) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "unknown_error";
  return NextResponse.json({ error: "INTERNAL_ERROR", message }, { status: 500 });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function publicUser(user: FinalUser) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    avatarGender: user.avatarGender,
    phone: user.phone,
    loginId: user.loginId,
    storeId: user.storeId,
    hireDate: user.hireDate,
    status: user.status,
    rejectReason: user.rejectReason,
    approvedAt: user.approvedAt,
    completedAt: user.completedAt,
    inactiveAt: user.inactiveAt,
    exp: user.exp,
    badgeIds: user.badgeIds
  };
}

export function publicSummary(summary: RookieSummary): RookieSummary {
  return {
    ...summary,
    user: publicUser(summary.user)
  };
}

function getRequesterId(request: Request, config: FinalUQuestConfig, kind: UQuestRequesterKind) {
  const url = new URL(request.url);
  const cookieUserId = readCookie(request, "uquest_user_id");
  if (cookieUserId) return cookieUserId;

  if (process.env.NODE_ENV === "production") {
    throw new UQuestDomainError("FORBIDDEN_ROLE", "로그인이 필요합니다.", 401);
  }

  const devOnlyUserId = request.headers.get("x-uquest-user-id") ?? url.searchParams.get("userId");
  if (devOnlyUserId) return devOnlyUserId;

  if (kind === "admin") return config.adminUserId;
  if (kind === "manager") return config.managerUserId;
  return config.activeUserId;
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const pairs = cookie.split(";").map((item) => item.trim());
  const match = pairs.find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
