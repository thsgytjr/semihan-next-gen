import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, ChevronRight, Plus, MapPin } from "lucide-react";
import { ClassTag } from "@/components/ui/class-tag";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
};

export default async function TeachersPage({ params }: Props) {
  const { locale, departmentSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: department } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", departmentSlug)
    .single();

  if (!department) notFound();

  const [{ data: teachers }, { data: students }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("department_id", department.id)
      .eq("role", "teacher")
      .order("display_name"),
    supabase
      .from("students")
      .select("teacher_id, class_tag, service_slot")
      .eq("department_id", department.id)
      .eq("is_active", true),
  ]);
  const teacherList = teachers ?? [];

  return (
    <>
      <Header title={t("teachers.title")}>
        <Badge variant="secondary" className="text-xs font-semibold">
          {teacherList.length}명
        </Badge>
        <Link href={`/${locale}/dashboard/${departmentSlug}/teachers/new`}>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("teachers.addTeacher")}
          </Button>
        </Link>
      </Header>

      <main className="flex-1 p-4 lg:p-6 space-y-4">
        {teacherList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-8 mb-4">
              <GraduationCap className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="font-bold text-xl mb-1">{t("teachers.noTeachers")}</h3>
            <p className="text-sm text-muted-foreground">
              선생님 계정은 회원가입 후 관리자가 역할을 지정합니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teacherList.map((teacher) => {
              const relevantStudents = (students ?? []).filter(
                (s) =>
                  s.teacher_id === teacher.id &&
                  (!teacher.service_slot || s.service_slot === teacher.service_slot)
              );
              const count = relevantStudents.length;
              const classes = Array.from(
                new Set(relevantStudents.filter((s) => s.class_tag).map((s) => s.class_tag))
              ).sort();

              return (
                <Link
                  key={teacher.id}
                  href={`/${locale}/dashboard/${departmentSlug}/teachers/${teacher.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-green-500/30 hover:shadow-md hover:shadow-green-500/5 transition-all active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                    <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base">{teacher.display_name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {teacher.campus && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{teacher.campus}
                        </span>
                      )}
                      {teacher.service_slot && (
                        <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-700 dark:text-blue-400">
                          {teacher.service_slot}
                        </Badge>
                      )}
                      {teacher.email && (
                        <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                      )}
                    </div>
                    {classes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {classes.map((cls) => (
                          <ClassTag key={cls} tag={cls} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Users className="h-3 w-3" />
                        {t("teachers.assignedCount", { count })}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
