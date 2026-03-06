import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignToClassForm } from "@/components/teachers/assign-to-class-form";
import { GraduationCap, Users, ChevronRight, Edit, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string; teacherId: string }>;
};

export default async function TeacherDetailPage({ params }: Props) {
  const { locale, departmentSlug, teacherId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  const [{ data: teacher }, { data: department }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", teacherId).single(),
    supabase.from("departments").select("*").eq("slug", departmentSlug).single(),
  ]);

  if (!teacher || !department) notFound();

  // Get assigned students — if teacher has a service_slot, only show matching students
  const assignedQuery = supabase
    .from("students")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("department_id", department.id)
    .eq("is_active", true)
    .order("class_tag", { ascending: true, nullsFirst: false })
    .order("name");

  if (teacher.service_slot) {
    assignedQuery.eq("service_slot", teacher.service_slot);
  }

  const { data: assignedStudents } = await assignedQuery;

  // Get all class tags in the department for the assign form
  const { data: allStudents } = await supabase
    .from("students")
    .select("class_tag")
    .eq("department_id", department.id)
    .eq("is_active", true)
    .not("class_tag", "is", null);

  const allClassTags = Array.from(
    new Set((allStudents ?? []).map((s) => s.class_tag!).filter(Boolean))
  ).sort();

  // Group assigned students by class_tag
  const grouped = new Map<string, typeof assignedStudents>();
  const noClass: typeof assignedStudents = [];

  for (const student of assignedStudents ?? []) {
    if (!student.class_tag) {
      noClass.push(student);
    } else {
      if (!grouped.has(student.class_tag)) grouped.set(student.class_tag, []);
      grouped.get(student.class_tag)!.push(student);
    }
  }

  const totalCount = (assignedStudents ?? []).length;

  return (
    <>
      <Header
        title={t("teachers.teacherDetail")}
        backHref={`/${locale}/dashboard/${departmentSlug}/teachers`}
      >
        <Link href={`/${locale}/dashboard/${departmentSlug}/teachers/${teacherId}/edit`}>
          <Button size="sm" variant="outline" className="h-8 px-3 text-sm rounded-lg gap-1.5">
            <Edit className="h-3.5 w-3.5" />
            {t("common.edit")}
          </Button>
        </Link>
        <Link href={`/${locale}/dashboard/${departmentSlug}/teachers`}>
          <Button size="sm" variant="outline" className="h-8 px-3 text-sm rounded-lg">
            {t("common.back")}
          </Button>
        </Link>
      </Header>

      <main className="flex-1 p-4 lg:p-6 space-y-4">
        {/* Teacher Info Card */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
              <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold">{teacher.display_name}</h2>
              <p className="text-sm text-muted-foreground">{teacher.email}</p>
              {teacher.campus && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />{teacher.campus}
                </p>
              )}
              {teacher.service_slot && (
                <p className="text-sm mt-0.5">
                  <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-700 dark:text-blue-400">
                    {teacher.service_slot}
                  </Badge>
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  {t("teachers.assignedCount", { count: totalCount })}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Assign to Class */}
        <AssignToClassForm
          teacherId={teacherId}
          departmentId={department.id}
          classTags={allClassTags}
        />

        {/* Students by class */}
        {totalCount > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">{t("teachers.studentsByClass")}</h3>
            </div>

            {Array.from(grouped.entries()).map(([classTag, groupStudents]) => (
              <div key={classTag}>
                <div className="px-4 py-2 bg-muted/40">
                  <span className="text-xs font-semibold text-muted-foreground">{classTag}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({groupStudents!.length}명)</span>
                </div>
                <div className="divide-y divide-border">
                  {groupStudents!.map((student) => (
                    <Link
                      key={student.id}
                      href={`/${locale}/dashboard/${departmentSlug}/students/${student.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{student.name}</p>
                        {student.birth_date && (
                          <p className="text-xs text-muted-foreground">{student.birth_date}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {student.service_slot && (
                          <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-700 dark:text-blue-400">
                            {student.service_slot}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {noClass.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-muted/40">
                  <span className="text-xs font-semibold text-muted-foreground">{t("teachers.noClass")}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({noClass.length}명)</span>
                </div>
                <div className="divide-y divide-border">
                  {noClass.map((student) => (
                    <Link
                      key={student.id}
                      href={`/${locale}/dashboard/${departmentSlug}/students/${student.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{student.name}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t("teachers.unassigned")}</p>
          </div>
        )}
      </main>
    </>
  );
}
