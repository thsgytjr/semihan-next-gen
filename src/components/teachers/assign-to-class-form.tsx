"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { assignTeacherToClass } from "@/app/actions/teachers";
import { useRouter } from "@/i18n/navigation";

interface AssignToClassFormProps {
  teacherId: string;
  departmentId: string;
  classTags: string[];
}

export function AssignToClassForm({ teacherId, departmentId, classTags }: AssignToClassFormProps) {
  const t = useTranslations("teachers");
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleAssign() {
    if (!selectedClass) return;
    setLoading(true);
    setMessage(null);
    const result = await assignTeacherToClass(teacherId, selectedClass, departmentId);
    setLoading(false);
    if (result.error) {
      setMessage({ type: "error", text: t("assignError") });
    } else {
      setMessage({ type: "success", text: t("assignSuccess") });
      router.refresh();
    }
  }

  if (classTags.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-sm">{t("assignToClass")}</h3>
      <p className="text-xs text-muted-foreground">{t("assignToClassDesc")}</p>
      <div className="flex flex-wrap gap-2">
        {classTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedClass(selectedClass === tag ? "" : tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              selectedClass === tag
                ? "bg-green-600 text-white border-green-600"
                : "bg-background text-foreground border-border hover:border-green-400"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
      <Button
        onClick={handleAssign}
        disabled={!selectedClass || loading}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-9 px-4"
      >
        {loading ? "배정 중..." : t("assignToClass")}
      </Button>
    </div>
  );
}
