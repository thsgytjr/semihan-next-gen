"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toggleAttendance } from "@/app/actions/attendance";
import type { Student } from "@/types/database";
import { cn } from "@/lib/utils";

interface AttendanceGridProps {
  students: Student[];
  eventId: string;
  attendedStudentIds: Set<string>;
}

export function AttendanceGrid({
  students,
  eventId,
  attendedStudentIds: initialAttended,
}: AttendanceGridProps) {
  const t = useTranslations("attendance");
  const [attended, setAttended] = useState<Set<string>>(initialAttended);
  const [isPending, startTransition] = useTransition();

  const presentCount = attended.size;
  const totalCount = students.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  function handleToggle(studentId: string) {
    const newCheckedIn = !attended.has(studentId);

    // Optimistic update
    setAttended((prev) => {
      const next = new Set(prev);
      if (newCheckedIn) {
        next.add(studentId);
      } else {
        next.delete(studentId);
      }
      return next;
    });

    // Server action
    startTransition(async () => {
      const result = await toggleAttendance(studentId, eventId, newCheckedIn);
      if (result.error) {
        // Revert on error
        setAttended((prev) => {
          const next = new Set(prev);
          if (newCheckedIn) {
            next.delete(studentId);
          } else {
            next.add(studentId);
          }
          return next;
        });
      }
    });
  }

  function handleMarkAll() {
    const allIds = students.map((s) => s.id);
    const allChecked = allIds.every((id) => attended.has(id));

    if (allChecked) {
      // Unmark all
      setAttended(new Set());
      startTransition(async () => {
        for (const student of students) {
          await toggleAttendance(student.id, eventId, false);
        }
      });
    } else {
      // Mark all
      setAttended(new Set(allIds));
      startTransition(async () => {
        for (const student of students) {
          if (!attended.has(student.id)) {
            await toggleAttendance(student.id, eventId, true);
          }
        }
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">
          {t("present", { count: presentCount })}
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {t("total", { count: totalCount })}
        </Badge>
        <Badge
          variant={rate >= 80 ? "default" : "secondary"}
          className={cn(
            "text-sm px-3 py-1",
            rate >= 80
              ? "bg-green-600 hover:bg-green-700"
              : ""
          )}
        >
          {t("attendanceRate", { rate })}
        </Badge>
        <button
          onClick={handleMarkAll}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          disabled={isPending}
        >
          {students.every((s) => attended.has(s.id))
            ? t("unmarkAll")
            : t("markAll")}
        </button>
      </div>

      {/* Student Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {students.map((student) => {
          const isCheckedIn = attended.has(student.id);
          return (
            <button
              key={student.id}
              onClick={() => handleToggle(student.id)}
              disabled={isPending}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 select-none",
                isCheckedIn
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 shadow-md"
                  : "border-transparent bg-card hover:bg-accent/50 shadow-sm",
                isPending && "opacity-70"
              )}
            >
              {/* Check overlay */}
              {isCheckedIn && (
                <div className="absolute top-2 right-2 rounded-full bg-green-500 p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <StudentAvatar student={student} size="md" />
              <span
                className={cn(
                  "text-sm font-medium truncate max-w-full",
                  isCheckedIn ? "text-green-700 dark:text-green-300" : ""
                )}
              >
                {student.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
