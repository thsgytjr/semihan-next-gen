"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Check, Users, UserCheck, BarChart2 } from "lucide-react";
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
  const absentCount = totalCount - presentCount;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  function handleToggle(studentId: string) {
    const newCheckedIn = !attended.has(studentId);

    setAttended((prev) => {
      const next = new Set(prev);
      if (newCheckedIn) {
        next.add(studentId);
      } else {
        next.delete(studentId);
      }
      return next;
    });

    startTransition(async () => {
      const result = await toggleAttendance(studentId, eventId, newCheckedIn);
      if (result.error) {
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
      setAttended(new Set());
      startTransition(async () => {
        for (const student of students) {
          await toggleAttendance(student.id, eventId, false);
        }
      });
    } else {
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

  const allMarked = students.length > 0 && students.every((s) => attended.has(s.id));

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/40 p-3 gap-1">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xl font-bold text-green-700 dark:text-green-300">{presentCount}</span>
          </div>
          <span className="text-[10px] text-green-600/70 dark:text-green-400/70 font-medium">출석</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-background border border-border p-3 gap-1">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl font-bold">{totalCount}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">전체</span>
        </div>
        <div className={cn(
          "flex flex-col items-center justify-center rounded-2xl border p-3 gap-1",
          rate >= 80
            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40"
        )}>
          <div className="flex items-center gap-1.5">
            <BarChart2 className={cn("h-4 w-4", rate >= 80 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400")} />
            <span className={cn("text-xl font-bold", rate >= 80 ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-amber-300")}>{rate}%</span>
          </div>
          <span className={cn("text-[10px] font-medium", rate >= 80 ? "text-blue-600/70 dark:text-blue-400/70" : "text-amber-600/70 dark:text-amber-400/70")}>출석률</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-400"
          )}
          style={{ width: `${rate}%` }}
        />
      </div>

      {/* Mark All / Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {absentCount > 0 ? `${absentCount}명 미출석` : "전원 출석 완료 🎉"}
        </p>
        <button
          onClick={handleMarkAll}
          disabled={isPending}
          className={cn(
            "text-sm font-medium px-3 py-1.5 rounded-full transition-all active:scale-95",
            allMarked
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-green-600 text-white hover:bg-green-700"
          )}
        >
          {allMarked ? t("unmarkAll") : t("markAll")}
        </button>
      </div>

      {/* Student Grid */}
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {students.map((student) => {
          const isCheckedIn = attended.has(student.id);
          return (
            <button
              key={student.id}
              onClick={() => handleToggle(student.id)}
              disabled={isPending}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 select-none active:scale-95",
                isCheckedIn
                  ? "border-green-500 bg-green-50 dark:bg-green-950/40 shadow-md shadow-green-500/10"
                  : "border-border bg-card hover:border-muted-foreground/30 shadow-sm",
                isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              {/* Check badge */}
              {isCheckedIn && (
                <div className="absolute -top-1.5 -right-1.5 rounded-full bg-green-500 p-0.5 shadow-sm">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <StudentAvatar student={student} size="md" />
              <span
                className={cn(
                  "text-xs font-medium text-center leading-tight line-clamp-2 w-full",
                  isCheckedIn ? "text-green-700 dark:text-green-300" : "text-foreground"
                )}
              >
                {student.name}
              </span>

              {/* Status pill */}
              <div className={cn(
                "text-[9px] font-semibold px-2 py-0.5 rounded-full leading-none",
                isCheckedIn
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {isCheckedIn ? "출석" : "미출석"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
