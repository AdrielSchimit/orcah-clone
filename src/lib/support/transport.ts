export interface SupportTransport {
  subscribe(onRefresh: (signal: AbortSignal) => Promise<void>, onConnection: (connected: boolean) => void): () => void;
}

export function pollingTransport(interval = 2000): SupportTransport {
  return { subscribe(refresh, connection) {
    const controller = new AbortController();
    let stopped = false, running = false, failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (stopped || running) return;
      clearTimeout(timer);
      if (document.visibilityState === "hidden" || !navigator.onLine) {
        connection(false); timer = setTimeout(tick, interval); return;
      }
      running = true;
      try { await refresh(controller.signal); failures = 0; if (!stopped) connection(true); }
      catch { failures++; if (!stopped) connection(false); }
      finally { running = false; if (!stopped) timer = setTimeout(tick, Math.min(30000, interval * 2 ** Math.min(failures, 4))); }
    };
    const resume = () => { if (document.visibilityState !== "hidden" && navigator.onLine) void tick(); };
    document.addEventListener("visibilitychange", resume); window.addEventListener("online", resume);
    void tick();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); document.removeEventListener("visibilitychange", resume); window.removeEventListener("online", resume); };
  } };
}

export async function supportFetch<T>(url: string, body?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(url, { method: body === undefined ? "GET" : method, credentials: "same-origin", cache: "no-store", headers: body === undefined ? undefined : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Falha ao atualizar o suporte.");
  return data as T;
}
