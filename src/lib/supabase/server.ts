import { createClient } from "@supabase/supabase-js";

// =============================================================================
// U-Quest 프로젝트 격리 헌법 (절대 규칙)
// -----------------------------------------------------------------------------
// 이 앱은 오직 U-Quest 프로젝트에만 연결한다.
// Cashflow 등 다른 Supabase 프로젝트로의 연결은 어떤 경우에도 허용하지 않는다.
// 자격 증명이 잘못 주입되면 조용히 붙지 않고 즉시 throw 한다 (fail-closed).
// 헌법 전문: SYSTEM_ARCHITECTURE.md "Supabase 프로젝트 격리 헌법" 참조.
// =============================================================================
const UQUEST_PROJECT_REF = "ofeqiqauhvcovtzjangm";

// 절대 연결 금지 프로젝트 (혼동/충돌 방지). ref -> 사람이 읽는 이름.
const FORBIDDEN_PROJECT_REFS: Record<string, string> = {
  ecfjkfqlnqfxovlwhdtx: "Cashflow"
};

function projectRefFromUrl(url: string): string | null {
  const match = /^https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(url.trim());
  return match ? match[1].toLowerCase() : null;
}

function projectRefFromKey(key: string): string | null {
  const segment = key.split(".")[1];
  if (!segment) return null;
  try {
    const json = Buffer.from(
      segment.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const ref = (JSON.parse(json) as { ref?: unknown }).ref;
    return typeof ref === "string" ? ref.toLowerCase() : null;
  } catch {
    return null;
  }
}

// 주입된 URL/키가 U-Quest 프로젝트가 맞는지 검증한다. 다르면 throw.
function assertUQuestProject(url: string, key: string): void {
  const urlRef = projectRefFromUrl(url);
  const keyRef = projectRefFromKey(key);

  const checks: Array<readonly [string | null, string]> = [
    [urlRef, "NEXT_PUBLIC_SUPABASE_URL"],
    [keyRef, "Supabase 키"]
  ];

  for (const [ref, label] of checks) {
    if (!ref) continue;

    const forbidden = FORBIDDEN_PROJECT_REFS[ref];
    if (forbidden) {
      throw new Error(
        `[U-Quest 헌법 위반] ${label}이(가) 연결 금지 프로젝트 '${forbidden}'(${ref})를 가리킵니다. ` +
          `U-Quest는 '${UQUEST_PROJECT_REF}' 프로젝트에만 연결할 수 있습니다.`
      );
    }

    if (ref !== UQUEST_PROJECT_REF) {
      throw new Error(
        `[U-Quest 헌법 위반] ${label}의 프로젝트 '${ref}'가 허용된 '${UQUEST_PROJECT_REF}'와 다릅니다.`
      );
    }
  }

  if (urlRef && keyRef && urlRef !== keyRef) {
    throw new Error(
      `[U-Quest 헌법 위반] URL 프로젝트('${urlRef}')와 키 프로젝트('${keyRef}')가 서로 다릅니다. 프로젝트 자격 증명이 섞였습니다.`
    );
  }
}

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  // U-Quest 프로젝트가 아니면 연결 자체를 막는다.
  assertUQuestProject(url, key);

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
