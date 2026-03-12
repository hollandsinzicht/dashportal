"use client";

import { Badge } from "@/components/ui/Badge";

interface RefreshStatusBadgeProps {
  status: string | null;
}

export function RefreshStatusBadge({ status }: RefreshStatusBadgeProps) {
  if (!status) {
    return <Badge variant="default">Onbekend</Badge>;
  }

  const normalized = status.toLowerCase();

  if (normalized === "completed" || normalized === "succeeded") {
    return <Badge variant="success">Geslaagd</Badge>;
  }

  if (normalized === "failed") {
    return <Badge variant="danger">Mislukt</Badge>;
  }

  if (normalized === "disabled") {
    return <Badge variant="default">Uitgeschakeld</Badge>;
  }

  if (normalized === "unknown") {
    return <Badge variant="default">Onbekend</Badge>;
  }

  return <Badge variant="warning">{status}</Badge>;
}
