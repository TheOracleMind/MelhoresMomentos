export const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

type MetaPixelEvent = "PageView" | "Purchase";

type MetaPixelParams = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: string;
  content_name?: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaPixelEvent(eventName: MetaPixelEvent, params?: MetaPixelParams) {
  if (!metaPixelId || typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", eventName, params || {});
}
