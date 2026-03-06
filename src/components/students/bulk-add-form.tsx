"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { bulkCreateStudents } from "@/app/actions/students";
import { CheckCircle2, Users } from "lucide-react";

interface Teacher {
  id: string;
  display_name: string;
}

interface BulkAddFormProps {
  departmentId: string;
  departmentSlug: string;
  existingTags: string[];
  teachers: Teacher[];
}

export function BulkAddForm({ departmentId, departmentSlug, existingTags, teachers }: BulkAddFormProps) {
  const t = useTranslations("students");
  const router = useRouter();

  const [names, setNames] = useState("");
  const [classTag, setClassTag] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [campus, setCampus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const nameList = names
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessCount(null);

    const result = await bulkCreateStudents(nameList, departmentId, {
      classTag: classTag.trim() || undefined,
      teacherId: teacherId || undefined,
      campus: campus || undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccessCount(result.count ?? nameList.length);
      setNames("");
      setTimeout(() => {
        router.push(`/dashboard/${departmentSlug}/students`);
        router.refresh();
      }, 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
        >
          취소
        </button>
        <h1 className="text-base font-semibold">{t("bulkAddTitle")}</h1>
        <Button
          type="submit"
          size="sm"
          disabled={loading || nameList.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 h-8"
        >
          {loading ? "등록중..." : `${nameList.length}명 등록`}
        </Button>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {successCount !== null && (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4 flex items-center gap-3 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {t("bulkAddSuccess", { count: successCount })}
            </p>
          </div>
        )}

        {/* Names textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="names" className="text-sm font-medium">
              {t("bulkAddHint")}
            </Label>
            {nameList.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="h-3 w-3" />
                {t("bulkAddCount", { count: nameList.length })}
              </span>
            )}
          </div>
          <textarea
            id="names"
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder={t("bulkAddPlaceholder")}
            rows={10}
            className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none font-mono"
          />
        </div>

        {/* Preview list */}
        {nameList.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
            <div className="px-4 py-2 border-b border-border bg-muted/60">
              <p className="text-xs font-medium text-muted-foreground">등록 미리보기</p>
            </div>
            <div className="divide-y divide-border max-h-48 overflow-y-auto">
              {nameList.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium">{name}</span>
                  {classTag && (
                    <span className="ml-auto text-xs border border-green-500/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      {classTag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-muted-foreground">공통 설정 (선택사항)</p>

          {/* Campus */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("campus")}</Label>
            <div className="flex gap-2">
              {["", "노스", "캐롤턴"].map((c) => (
                <button
                  key={c || "none"}
                  type="button"
                  onClick={() => setCampus(c)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border border-border bg-background text-foreground hover:border-gray-400 transition-all"
                  style={campus === c ? { backgroundColor: "#16a34a", color: "#ffffff", borderColor: "#16a34a" } : {}}
                >
                  {c === "" ? t("campusUnset") : c}
                </button>
              ))}
            </div>
          </div>

          {/* Class Tag */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("classTag")}</Label>
            {existingTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {existingTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setClassTag(classTag === tag ? "" : tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                      classTag === tag
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-background text-foreground border-border hover:border-green-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={classTag}
              onChange={(e) => setClassTag(e.target.value)}
              placeholder={t("classTagPlaceholder")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              list="bulk-class-tag-suggestions"
            />
            <datalist id="bulk-class-tag-suggestions">
              {existingTags.map((tag) => <option key={tag} value={tag} />)}
            </datalist>
          </div>

          {/* Teacher */}
          {teachers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("teacher")}</Label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("noTeacher")}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
