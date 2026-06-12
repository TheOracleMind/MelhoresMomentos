export type AnalyticsEventName = "landing_view" | "create_started" | "offer_view";

export function getVisitorId() {
  const key = "melhores-momentos-visitor-id";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

export function trackAnalyticsEvent(eventName: AnalyticsEventName, lovePageId?: string) {
  const body = {
    eventName,
    visitorId: getVisitorId(),
    lovePageId
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/event", new Blob([JSON.stringify(body)], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true
  }).catch(() => undefined);
}
