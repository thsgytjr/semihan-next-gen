import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteStudentButton } from "@/components/students/delete-student-button";
import { Edit, Calendar, FileText, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string; studentId: string }>;
};

export default async function StudentDetailPage({ params }: Props) {
  const { locale, departmentSlug, studentId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) {
    notFound();
  }

  // Get attendance history
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("*, events(*)")
    .eq("student_id", studentId)
    .eq("checked_in", true)
    .order("checked_in_at", { ascending: false })
    .limit(20);

  return (
    <>
      <Header title={t("students.studentDetail")}>
        <Link href={`/${locale}/dashboard/${departmentSlug}/students/${studentId}/edit`}>
          <Button size="sm" variant="outline" className="h-8 px-3 text-sm rounded-lg gap-1.5">
            <Edit className="h-3.5 w-3.5" />
            {t("common.edit")}
          </Button>
        </Link>
        <DeleteStudentButton studentId={studentId} studentName={student.name} />
      </Header>

      <main className="flex-1 p-4 lg:p-6 space-y-4">
        {/* Student Profile Card */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <StudentAvatar student={student} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{student.name}</h2>
                <Badge
                  variant={student.is_active ? "default" : "secondary"}
                  className={student.is_active ? "bg-green-600 text-white text-xs" : "text-xs"}
                >
                  {student.is_active ? t("students.active") : t("students.inactive")}
                </Badge>
              </div>
              {student.birth_date && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {student.birth_date}
                </p>
              )}
              {student.notes && (
                <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-1">
                  <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{student.notes}</span>
                </p>
              )}
            </div>
          </div>

          {/* Attendance summary */}
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold">{attendanceRecords?.length ?? 0}회</span>
              <span className="text-sm text-muted-foreground">출석</span>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">{t("students.attendanceHistory")}</h3>
          </div>
          {!attendanceRecords || attendanceRecords.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">
                      {(record.events as { title: string })?.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(record.events as { date: string })?.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">{t("attendance.checkedIn")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
