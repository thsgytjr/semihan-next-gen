"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeacher, updateTeacher } from "@/app/actions/teachers";
import type { Profile } from "@/types/database";

interface TeacherFormProps {
  departmentId: string;
  departmentSlug: string;
  teacher?: Profile;
}

const CAMPUS_OPTIONS = ["", "노스", "캐롤튼"] as const;
const SERVICE_SLOT_OPTIONS = ["", "1부", "2부"] as const;

export function TeacherForm({ departmentId, departmentSlug, teacher }: TeacherFormProps) {
  const t = useTranslations("teachers");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const isEdit = !!teacher;
  const [displayName, setDisplayName] = useState(teacher?.display_name ?? "");
  const [campus, setCampus] = useState<string>(teacher?.campus ?? "");
  const [serviceSlot, setServiceSlot] = useState<string>(teacher?.service_slot ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let result;
    if (isEdit) {
      result = await updateTeacher(teacher.id, displayName.trim(), campus || null, serviceSlot || null);
    } else {
      result = await createTeacher(displayName.trim(), campus || null, serviceSlot || null, departmentId);
    }

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/dashboard/${departmentSlug}/teachers`);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="flex flex-col min-h-screen">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
          >
            {tCommon("cancel")}
          </button>
          <h1 className="text-base font-semibold">
            {isEdit ? t("editTeacher") : t("addTeacher")}
          </h1>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 h-8"
          >
            {loading ? tCommon("loading") : isEdit ? tCommon("save") : tCommon("save")}
          </Button>
        </div>

        <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium">
              {t("teacherName")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("teacherName")}
              required
              className="h-12 text-base rounded-xl"
            />
          </div>

          {/* Campus */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("campus")}</Label>
            <div className="flex gap-2">
              {CAMPUS_OPTIONS.map((c) => (
                <button
                  key={c || "unset"}
                  type="button"
                  onClick={() => setCampus(c)}
                  style={
                    campus === c
                      ? { backgroundColor: "#16a34a", color: "#ffffff", borderColor: "#16a34a" }
                      : {}
                  }
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border bg-background text-foreground hover:border-green-400 transition-all"
                >
                  {c === "" ? t("campusUnset") : c}
                </button>
              ))}
            </div>
          </div>

          {/* Service Slot */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("serviceSlot")}</Label>
            <div className="flex gap-2">
              {SERVICE_SLOT_OPTIONS.map((s) => (
                <button
                  key={s || "unset"}
                  type="button"
                  onClick={() => setServiceSlot(s)}
                  style={
                    serviceSlot === s
                      ? { backgroundColor: "#2563eb", color: "#ffffff", borderColor: "#2563eb" }
                      : {}
                  }
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border bg-background text-foreground hover:border-blue-400 transition-all"
                >
                  {s === "" ? t("serviceSlotUnset") : s}
                </button>
              ))}
            </div>
          </div>

          {isEdit && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              이메일 변경은 지원하지 않습니다.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
