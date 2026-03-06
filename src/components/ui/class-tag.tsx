"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  tag?: string | null;
  color?: string;
  className?: string;
}

const FRUIT_EMOJI: Record<string, string> = {
  "딸기반": "🍓",
  "사과반": "🍎",
  "오렌지반": "🍊",
  "포도반": "🍇",
};

const FRUIT_COLOR: Record<string, string> = {
  "딸기반": "#ef4444",
  "사과반": "#ef4444",
  "오렌지반": "#f97316",
  "포도반": "#7c3aed",
};

export function ClassTag({ tag, color, className }: Props) {
  if (!tag) return null;
  const resolvedColor = color ?? FRUIT_COLOR[tag] ?? "#22c55e";
  const emoji = FRUIT_EMOJI[tag];

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium inline-flex items-center gap-1 ${className ?? ""}`}
      style={{ backgroundColor: resolvedColor + "20", borderColor: resolvedColor, color: resolvedColor }}
    >
      {emoji && (
        <span
          aria-hidden
          className="leading-none"
          style={{ color: "initial", WebkitTextFillColor: "initial" }}
        >
          {emoji}
        </span>
      )}
      <span>{tag}</span>
    </Badge>
  );
}

export default ClassTag;
