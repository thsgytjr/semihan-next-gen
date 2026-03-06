"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Palette, Trash2 } from "lucide-react";
import { updateClassTagColor, deleteClassTag } from "@/app/actions/teachers";

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#14b8a6", "#3b82f6", "#6366f1",
  "#8b5cf6", "#ec4899", "#64748b", "#0d9488",
];

interface ClassTagInfo {
  name: string;
  count: number;
  color: string;
}

interface StudentClassFilterProps {
  tags: ClassTagInfo[];
  totalCount: number;
  hasServiceSlots?: boolean;
  campuses?: string[];
  departmentId?: string;
}

export function StudentClassFilter({
  tags,
  totalCount,
  hasServiceSlots,
  campuses = [],
  departmentId,
}: StudentClassFilterProps) {
  const t = useTranslations("students");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag");
  const selectedService = searchParams.get("service");
  const selectedCampus = searchParams.get("campus");

  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const [tagColors, setTagColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(tags.map((tag) => [tag.name, tag.color]))
  );
  const [, startTransition] = useTransition();

  function handleSelectTag(tag: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    params.delete("service");
    setPickerOpenFor(null);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSelectService(service: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (service) {
      params.set("service", service);
    } else {
      params.delete("service");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSelectCampus(campus: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (campus) {
      params.set("campus", campus);
    } else {
      params.delete("campus");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleColorPick(tagName: string, color: string) {
    setTagColors((prev) => ({ ...prev, [tagName]: color }));
    setPickerOpenFor(null);
    if (departmentId) {
      startTransition(async () => {
        await updateClassTagColor(departmentId, tagName, color);
      });
    }
  }

  if (tags.length === 0 && campuses.length === 0) return null;

  return (
    <div className="space-y-2" onClick={() => setPickerOpenFor(null)}>
      {/* Campus filter row */}
      {campuses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {([null, ...campuses] as (string | null)[]).map((campus) => {
            const isActive = campus === null ? !selectedCampus : selectedCampus === campus;
            return (
              <button
                key={campus ?? "all"}
                onClick={(e) => { e.stopPropagation(); handleSelectCampus(campus); }}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all bg-background text-foreground border-border hover:border-gray-400"
                style={isActive ? { backgroundColor: "#374151", color: "#ffffff", borderColor: "#374151" } : {}}
              >
                {campus === null ? t("campusAll") : campus}
              </button>
            );
          })}
        </div>
      )}

      {/* Class tag filter */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={(e) => { e.stopPropagation(); handleSelectTag(null); }}
            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all bg-background text-foreground border-border"
            style={!selectedTag ? { backgroundColor: "#16a34a", color: "#ffffff", borderColor: "#16a34a" } : {}}
          >
            {t("allClasses")}
            <span className="ml-1.5 text-xs opacity-70">{totalCount}</span>
          </button>

          {tags.map(({ name, count }) => {
            const color = tagColors[name] ?? "#22c55e";
            const isSelected = selectedTag === name;
            const isPickerOpen = pickerOpenFor === name;
            return (
              <div key={name} className="shrink-0 flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectTag(name); }}
                  className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: color, color: "#ffffff", borderColor: color }
                      : { backgroundColor: color + "20", borderColor: color, color }
                  }
                >
                  {name}
                  <span className="ml-1.5 text-xs opacity-70">{count}</span>
                </button>

                {departmentId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPickerOpenFor(isPickerOpen ? null : name); }}
                    className="p-1 rounded-full hover:bg-muted transition-all"
                    title="색상 변경"
                  >
                    <Palette className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                {departmentId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!confirm(`${name} 태그를 삭제하시겠습니까?\n(이 반을 사용 중인 학생의 반 정보는 삭제됩니다)`)) return;
                      startTransition(async () => {
                        await deleteClassTag(departmentId, name);
                      });
                    }}
                    className="p-1 rounded-full hover:bg-muted transition-all"
                    title="태그 삭제"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Color picker panel — rendered OUTSIDE overflow container so it's never clipped */}
      {pickerOpenFor && (
        <div
          className="flex items-center gap-2 p-2.5 bg-card border border-border rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="text-xs font-semibold shrink-0 px-2 py-1 rounded-full"
            style={{
              backgroundColor: (tagColors[pickerOpenFor] ?? "#22c55e") + "20",
              color: tagColors[pickerOpenFor] ?? "#22c55e",
            }}
          >
            {pickerOpenFor}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => handleColorPick(pickerOpenFor, c)}
                className="h-7 w-7 rounded-full border-2 transition-all hover:scale-110 shrink-0"
                style={{
                  backgroundColor: c,
                  borderColor: c === (tagColors[pickerOpenFor] ?? "#22c55e") ? "#111" : "transparent",
                  outline: c === (tagColors[pickerOpenFor] ?? "#22c55e") ? "2px solid #111" : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => setPickerOpenFor(null)}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground shrink-0 px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Service slot filter — shown when a class is selected and has service slots */}
      {selectedTag && hasServiceSlots && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {([null, "1부", "2부"] as (string | null)[]).map((slot) => (
            <button
              key={slot ?? "all"}
              onClick={(e) => { e.stopPropagation(); handleSelectService(slot); }}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all bg-background text-foreground border-border"
              style={selectedService === slot ? { backgroundColor: "#2563eb", color: "#ffffff", borderColor: "#2563eb" } : {}}
            >
              {slot === null ? t("serviceAll") : slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
