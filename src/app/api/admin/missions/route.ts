import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MissionGroup, MissionTask, UQuestAppConfig } from "@/types/uquest";

type AppConfigSnapshotRow = {
  payload: UQuestAppConfig;
  version: number;
};

type AddGroupRequest = {
  action: "add_group";
  group: {
    title: string;
    icon: string;
  };
};

type AddTaskRequest = {
  action: "add_task";
  groupId: string;
  task: {
    title: string;
    icon: string;
    rewardTicket: number;
  };
};

type AdminMissionRequest = AddGroupRequest | AddTaskRequest;

export async function POST(request: Request) {
  if (!isAdminWriteEnabled()) {
    return NextResponse.json({ error: "admin_write_disabled" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const input = (await request.json()) as AdminMissionRequest;
  const { data, error } = await supabase
    .from("app_config_snapshots")
    .select("payload, version")
    .eq("id", "current")
    .maybeSingle<AppConfigSnapshotRow>();

  if (error || !data?.payload) {
    return NextResponse.json({ error: "snapshot_not_found" }, { status: 500 });
  }

  const payload = mutateMissionConfig(data.payload, input);
  const nextVersion = (data.version ?? 1) + 1;

  const { error: updateError } = await supabase
    .from("app_config_snapshots")
    .update({
      payload,
      version: nextVersion
    })
    .eq("id", "current");

  if (updateError) {
    return NextResponse.json({ error: "snapshot_update_failed" }, { status: 500 });
  }

  return NextResponse.json({ config: { ...payload, source: "supabase" } });
}

function isAdminWriteEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.UQUEST_ENABLE_ADMIN_WRITE === "true";
}

function mutateMissionConfig(config: UQuestAppConfig, input: AdminMissionRequest): UQuestAppConfig {
  if (input.action === "add_group") {
    const title = sanitizeText(input.group.title);
    const icon = sanitizeIcon(input.group.icon, "📌");
    const group: MissionGroup = summarizeMissionGroup({
      id: `custom-group-${Date.now()}`,
      icon,
      title,
      completedCount: 0,
      totalCount: 0,
      statusLabel: "0 / 0 ▲",
      expanded: true,
      tasks: []
    });

    return {
      ...config,
      missionGroups: [...config.missionGroups, group]
    };
  }

  const title = sanitizeText(input.task.title);
  const icon = sanitizeIcon(input.task.icon, "✅");
  const rewardTicket = clamp(Math.round(input.task.rewardTicket || 1), 1, 500);

  return {
    ...config,
    missionGroups: config.missionGroups.map((group) => {
      if (group.id !== input.groupId) return group;

      const task: MissionTask = {
        id: `custom-task-${Date.now()}`,
        icon,
        title,
        completed: false,
        rewardTicket,
        sortOrder: group.tasks.length + 1,
        sourceLabel: "관리자 입력"
      };

      return summarizeMissionGroup({
        ...group,
        expanded: true,
        tasks: [...group.tasks, task]
      });
    })
  };
}

function summarizeMissionGroup(group: MissionGroup): MissionGroup {
  const completedCount = group.tasks.filter((task) => task.completed).length;
  const totalCount = group.tasks.length;
  const arrow = group.expanded ? "▲" : "▼";

  return {
    ...group,
    completedCount,
    totalCount,
    statusLabel: `${completedCount} / ${totalCount} ${arrow}`
  };
}

function sanitizeText(value: string) {
  return value.trim().slice(0, 80);
}

function sanitizeIcon(value: string, fallback: string) {
  return value.trim().slice(0, 4) || fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
