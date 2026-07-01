"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  SETTING_KEYS,
  type SettingsInput,
} from "@/features/admin/settings/constants";
import { SETTINGS_TAG } from "@/services/settings";

export async function updateSettings(input: SettingsInput) {
  await requireAdmin();
  for (const key of SETTING_KEYS) {
    const value = (input[key] ?? "").trim();
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: "general" },
    });
  }
  revalidatePath("/admin/settings");
  // Bust the cached storefront settings so pages (e.g. /contact) show the
  // new values on the next visit. Next 16 requires the second arg.
  revalidateTag(SETTINGS_TAG, "max");
  return { ok: true as const };
}
