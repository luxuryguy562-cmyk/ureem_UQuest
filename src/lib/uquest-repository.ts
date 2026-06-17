import { finalFallbackAppConfig } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FinalUQuestConfig } from "@/types/uquest";

type FinalAppConfigSnapshotRow = {
  payload: FinalUQuestConfig;
};

export async function getUQuestAppConfig(): Promise<FinalUQuestConfig> {
  const supabase = createServerSupabaseClient();
  const today = getOperationalToday();

  if (!supabase) {
    return {
      ...finalFallbackAppConfig,
      today
    };
  }

  const { data, error } = await supabase
    .from("app_config_snapshots")
    .select("payload")
    .eq("id", "current")
    .maybeSingle<FinalAppConfigSnapshotRow>();

  if (error || !isFinalConfig(data?.payload)) {
    return finalFallbackAppConfig;
  }

  return {
    ...withDefaults(finalFallbackAppConfig, data.payload),
    today,
    source: "supabase"
  };
}

export async function getMutableUQuestConfig(): Promise<FinalUQuestConfig> {
  return getUQuestAppConfig();
}

export async function saveMutableUQuestConfig(config: FinalUQuestConfig): Promise<FinalUQuestConfig> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      ...config,
      source: "fallback"
    };
  }

  const { data } = await supabase
    .from("app_config_snapshots")
    .select("version")
    .eq("id", "current")
    .maybeSingle<{ version: number }>();

  const nextVersion = (data?.version ?? 1) + 1;
  const { error } = await supabase.from("app_config_snapshots").upsert({
    id: "current",
    payload: config,
    version: nextVersion
  });

  if (error) {
    throw new Error("uquest_snapshot_save_failed");
  }

  return {
    ...config,
    source: "supabase"
  };
}

export async function uploadAxEvidence(userId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "evidence.png";
  const path = `${userId}/${Date.now()}-${safeName}`;
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return `/mock/ax-evidence/${path}`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let { error } = await supabase.storage.from("ax-evidence").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    await supabase.storage.createBucket("ax-evidence", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
    });

    const retry = await supabase.storage.from("ax-evidence").upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
    error = retry.error;
  }

  if (error) {
    throw new Error(`ax_evidence_upload_failed:${error.message}`);
  }

  const { data } = supabase.storage.from("ax-evidence").getPublicUrl(path);
  return data.publicUrl || `/storage/ax-evidence/${path}`;
}

function isFinalConfig(value: unknown): value is FinalUQuestConfig {
  if (!isRecord(value)) return false;

  return Array.isArray(value.users) && Array.isArray(value.curriculums) && Array.isArray(value.axCategories);
}

function withDefaults<T>(defaults: T, value: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(value) ? value : defaults) as T;
  }

  if (isRecord(defaults)) {
    const source = isRecord(value) ? value : {};
    const result: Record<string, unknown> = {};

    for (const [key, defaultValue] of Object.entries(defaults)) {
      result[key] = withDefaults(defaultValue, source[key]);
    }

    for (const [key, sourceValue] of Object.entries(source)) {
      if (!(key in result)) result[key] = sourceValue;
    }

    return result as T;
  }

  return (value ?? defaults) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getOperationalToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}
