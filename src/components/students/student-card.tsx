"use client";

import { useTranslations } from "next-intl";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MapPin } from "lucide-react";
import type { Student } from "@/types/database";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: Student;
  classTagColor?: string;
  onClick?: () => void;
}

export function StudentCard({ student, classTagColor, onClick }: StudentCardProps) {
  const t = useTranslations("students");

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border border-border bg-card",
        "cursor-pointer active:scale-[0.98] transition-all duration-150",
        "hover:border-green-500/30 hover:shadow-md hover:shadow-green-500/5",
        !student.is_active && "opacity-60"
      )}
      onClick={onClick}
    >
      <StudentAvatar student={student} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base truncate">{student.name}</p>
        {student.birth_date && (
          <p className="text-sm text-muted-foreground truncate">
            {student.birth_date}
          </p>
        )}
        {student.notes && !student.birth_date && (
          <p className="text-sm text-muted-foreground truncate">
            {student.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {student.campus && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {student.campus}
          </span>
        )}
        {student.service_slot && (
          <Badge variant="outline" className="text-xs font-medium border-blue-500/40 text-blue-700 dark:text-blue-400">
            {student.service_slot}
          </Badge>
        )}
        {student.class_tag && (
          <Badge
            variant="outline"
            className="text-xs font-medium"
            style={classTagColor
              ? { backgroundColor: classTagColor + "20", borderColor: classTagColor, color: classTagColor }
              : {}}
          >
            {student.class_tag}
          </Badge>
        )}
        {!student.is_active && (
          <Badge variant="secondary" className="text-xs">{t("inactive")}</Badge>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </div>
  );
}

