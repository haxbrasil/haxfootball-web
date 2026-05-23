export const accountSessionChangedEvent = "bfl-account-session-changed";

export function notifyAccountSessionChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(accountSessionChangedEvent));
}
