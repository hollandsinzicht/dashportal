"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ReportTileProps {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  tenantSlug: string;
  /** Demo-modus: onClick i.p.v. Link navigatie */
  onClick?: () => void;
}

export function ReportTile({
  id,
  title,
  description,
  category,
  thumbnailUrl,
  tenantSlug,
  onClick,
}: ReportTileProps) {
  const content = (
    <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 group">
      {/* Thumbnail */}
      <div className="aspect-[16/10] bg-surface-secondary flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <BarChart3 className="w-10 h-10 text-primary/20" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
            {description}
          </p>
        )}
        {category && (
          <div className="mt-3">
            <Badge variant="accent">{category}</Badge>
          </div>
        )}
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

  return <Link href={`/${tenantSlug}/report/${id}`}>{content}</Link>;
}
