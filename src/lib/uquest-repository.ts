import { fallbackAppConfig } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UQuestAppConfig } from "@/types/uquest";

type AppConfigSnapshotRow = {
  payload: UQuestAppConfig;
};

export async function getUQuestAppConfig(): Promise<UQuestAppConfig> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return fallbackAppConfig;
  }

  const { data, error } = await supabase
    .from("app_config_snapshots")
    .select("payload")
    .eq("id", "current")
    .maybeSingle<AppConfigSnapshotRow>();

  if (error || !data?.payload) {
    return fallbackAppConfig;
  }

  const payload = withDefaults(fallbackAppConfig, data.payload);

  return {
    ...payload,
    source: "supabase"
  };
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
