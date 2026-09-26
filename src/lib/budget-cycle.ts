export type CycleStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "waiting"
  | "approved"
  | "rejected"
  | "expired";

export function publicCanRespond(status: CycleStatus | string) {
  return status === "draft" || status === "sent" || status === "viewed";
}

export function statusAfterProviderEdit(status: CycleStatus) {
  return status === "waiting" ? "sent" : status;
}

export function nextBudgetVersion(latest: number | null | undefined) {
  return (latest ?? 0) + 1;
}

export function republishEventMetadata(input: {
  version: number;
  total: string;
  previousTotal: string;
}) {
  return {
    republished: true,
    version: input.version,
    total: input.total,
    previousTotal: input.previousTotal,
  };
}

export function isRepublishMetadata(metadata: unknown): metadata is {
  republished: true;
  version?: number;
  total?: string;
  previousTotal?: string;
} {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      "republished" in metadata &&
      (metadata as { republished?: unknown }).republished === true,
  );
}
