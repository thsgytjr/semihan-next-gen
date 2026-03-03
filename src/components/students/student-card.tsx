"use client";

import { useTranslations } from "next-intl";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/types/database";

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  const t = useTranslations("students");

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors group"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <StudentAvatar student={student} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{student.name}</p>
          {student.notes && (
            <p className="text-sm text-muted-foreground truncate">
              {student.notes}
            </p>
          )}
        </div>
        {!student.is_active && (
          <Badge variant="secondary">{t("inactive")}</Badge>
        )}
      </CardContent>
    </Card>
  );
}
