import { createHash, randomBytes } from "crypto";

import type { FinalUQuestConfig, FinalUser } from "@/types/uquest";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `sha256$${salt}$${digest}`;
}

export function verifyPassword(password: string, storedHash?: string) {
  if (!storedHash) return false;
  const [algorithm, salt, digest] = storedHash.split("$");
  if (algorithm !== "sha256" || !salt || !digest) return false;
  const nextDigest = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return digest === nextDigest;
}

export function createSignupUser(
  data: FinalUQuestConfig,
  input: {
    name: string;
    phone: string;
    loginId: string;
    password: string;
    storeId: string;
    hireDate: string;
    avatarGender?: "male" | "female";
  }
) {
  if (!input.name.trim()) throw new Error("NAME_REQUIRED");
  if (!input.phone.trim()) throw new Error("PHONE_REQUIRED");
  if (!input.loginId.trim()) throw new Error("LOGIN_ID_REQUIRED");
  if (input.password.length < 6) throw new Error("PASSWORD_TOO_SHORT");
  if (!data.stores.some((store) => store.id === input.storeId && store.isActive)) throw new Error("STORE_NOT_FOUND");
  if (data.users.some((user) => user.loginId === input.loginId.trim())) throw new Error("LOGIN_ID_DUPLICATED");

  const user: FinalUser = {
    id: `rookie-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role: "rookie",
    name: input.name.trim(),
    avatarGender: input.avatarGender ?? "male",
    phone: input.phone.trim(),
    loginId: input.loginId.trim(),
    passwordHash: hashPassword(input.password),
    storeId: input.storeId,
    hireDate: input.hireDate,
    status: "pending",
    exp: 0,
    badgeIds: []
  };

  return {
    ...data,
    users: [...data.users, user],
    notifications: [
      ...data.notifications,
      {
        id: `noti-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        targetRole: "admin" as const,
        type: "signup_pending",
        title: "가입 승인 요청",
        message: `${user.name}님 계정 승인이 필요합니다.`,
        isRead: false,
        createdAt: `${data.today}T10:00:00+09:00`
      }
    ]
  };
}

export function findLoginUser(data: FinalUQuestConfig, loginId: string, password: string) {
  const user = data.users.find((item) => item.loginId === loginId.trim());
  if (!user) return null;
  if (user.passwordHash && !verifyPassword(password, user.passwordHash)) return null;
  if (!user.passwordHash && password !== "demo") return null;
  return user;
}
