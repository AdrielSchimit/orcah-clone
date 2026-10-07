export interface SupportTransport {
  subscribe(onRefresh: (signal: AbortSignal) => Promise<void>, onConnection: (connected: boolean) => void): () => void;
}

export function pollingTransport(interval = 2000): SupportTransport {
  return { subscribe(refresh, connection) {
    let controller: AbortController | undefined;
    let stopped = false, running = false, failures = 0, resumeRequested = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const available = () => document.visibilityState !== "hidden" && navigator.onLine;
    const tick = async () => {
      if (stopped || running || !available()) return;
      clearTimeout(timer);
      running = true;
      const request = new AbortController(); controller = request;
      try { await refresh(request.signal); if (!stopped && !request.signal.aborted) { failures = 0; connection(true); } }
      catch { if (!stopped && !request.signal.aborted) { failures++; connection(false); } }
      finally {
        running = false; controller = undefined;
        if (!stopped && available()) {
          if (resumeRequested) { resumeRequested = false; void tick(); }
          else timer = setTimeout(tick, Math.min(30000, interval * 2 ** Math.min(failures, 4)));
        }
      }
    };
    const resume = () => {
      clearTimeout(timer);
      if (!available()) { resumeRequested = false; controller?.abort(); connection(false); return; }
      failures = 0; resumeRequested = running;
      if (!running) void tick();
    };
    document.addEventListener("visibilitychange", resume); window.addEventListener("online", resume); window.addEventListener("offline", resume);
    resume();
    return () => { stopped = true; controller?.abort(); clearTimeout(timer); document.removeEventListener("visibilitychange", resume); window.removeEventListener("online", resume); window.removeEventListener("offline", resume); };
  } };
}

export async function supportFetch<T>(url: string, body?: unknown, method = "POST", signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(15000);
  const response = await fetch(url, { method: body === undefined ? "GET" : method, credentials: "same-origin", cache: "no-store", headers: body === undefined ? undefined : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Falha ao atualizar o suporte.");
  return data as T;
}
