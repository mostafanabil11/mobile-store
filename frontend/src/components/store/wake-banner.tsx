import { getSettingsState } from "@/lib/api";
import { WakeBannerClient } from "./wake-banner-client";

/** Shown only when the API didn't answer in time (usually Render waking from sleep). */
export async function WakeBanner() {
  const { online } = await getSettingsState();
  return online ? null : <WakeBannerClient />;
}
