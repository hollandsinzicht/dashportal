"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";

interface WorkspaceCardProps {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  reportCount: number;
  tenantSlug: string;
  /** Demo-modus: onClick i.p.v. Link navigatie */
  onClick?: () => void;
}

export function WorkspaceCard({
  id,
  name,
  thumbnailUrl,
  reportCount,
  tenantSlug,
  onClick,
}: WorkspaceCardProps) {
  const content = (
    <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
      {/* Thumbnail */}
      <div className="aspect-[16/10] bg-surface-secondary flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FolderOpen className="w-10 h-10 text-primary/20" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-[family-name:var(--font-syne)] font-semibold text-text-primary group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {reportCount} rapport{reportCount !== 1 ? "en" : ""}
        </p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full">
        {content}
      </button>
    );
  }

  return <Link href={`/${tenantSlug}/workspace/${id}`}>{content}</Link>;
}
