import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteStudentButton } from "@/components/students/delete-student-button";
import { Edit, Calendar } from "lucide-react";
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
        <Link
          href={`/${locale}/dashboard/${departmentSlug}/students/${studentId}/edit`}
        >
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        </Link>
        <DeleteStudentButton
          studentId={studentId}
          studentName={student.name}
        />
      </Header>

      <main className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Student Info */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
            <StudentAvatar student={student} size="lg" />
            <div className="text-center sm:text-left space-y-2">
              <h2 className="text-2xl font-bold">{student.name}</h2>
              {student.birth_date && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {student.birth_date}
                </p>
              )}
              {student.notes && (
                <p className="text-muted-foreground">{student.notes}</p>
              )}
              <Badge variant={student.is_active ? "default" : "secondary"}>
                {student.is_active ? t("students.active") : t("students.inactive")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle>{t("students.attendanceHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!attendanceRecords || attendanceRecords.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t("common.noData")}
              </p>
            ) : (
              <div className="space-y-2">
                {attendanceRecords.map((record) => (
                  <div key={record.id}>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-sm">
                          {(record.events as { title: string })?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(record.events as { date: string })?.date}
                        </p>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        {t("attendance.checkedIn")}
                      </Badge>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
