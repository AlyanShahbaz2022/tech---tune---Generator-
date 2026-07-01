import "server-only";

import { unstable_cache } from "next/cache";

import { SETTING_KEYS } from "@/features/admin/settings/constants";
import { siteConfig } from "@/constants/site";
import { prisma } from "@/lib/prisma";

export const SETTINGS_TAG = "site-settings";

export type SiteSettings = {
  name: string;
  logo: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  currency: string;
};

/**
 * Live site settings from the admin Settings module, merged over the static
 * `siteConfig` defaults so any unset field falls back gracefully. Cached and
 * revalidated via `SETTINGS_TAG` whenever an admin saves settings.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...SETTING_KEYS] } },
    });

    const map: Record<string, string> = {};
    for (const row of rows) {
      const v =
        typeof row.value === "string" ? row.value : String(row.value ?? "");
      if (v.trim()) map[row.key] = v.trim();
    }

    return {
      name: map.company_name || siteConfig.name,
      logo: map.company_logo || null,
      email: map.company_email || siteConfig.contact.email,
      phone: map.company_phone || siteConfig.contact.phone,
      whatsapp: map.whatsapp_number || siteConfig.contact.whatsapp,
      address: map.company_address || siteConfig.contact.address,
      currency: map.currency || "PKR",
    };
  },
  ["site-settings"],
  { tags: [SETTINGS_TAG] },
);
