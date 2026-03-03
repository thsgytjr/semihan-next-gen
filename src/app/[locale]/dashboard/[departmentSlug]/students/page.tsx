import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StudentCard } from "@/components/students/student-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
};

export default async function StudentsPage({ params }: Props) {
  const { locale, departmentSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  // Get department
  const { data: department } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", departmentSlug)
    .single();

  if (!department) {
    return <div>Department not found</div>;
  }

  // Get active students
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("department_id", department.id)
    .eq("is_active", true)
    .order("name");

  return (
    <>
      <Header title={t("students.title")}>
        <Badge variant="secondary" className="text-xs font-semibold">
          {t("students.totalCount", { count: students?.length ?? 0 })}
        </Badge>
        <Link href={`/${locale}/dashboard/${departmentSlug}/students/new`}>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("students.addStudent")}
          </Button>
        </Link>
      </Header>

      <main className="flex-1 p-4 lg:p-6">
        {!students || students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-8 mb-4">
              <Plus className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="font-bold text-xl mb-1">{t("students.noStudents")}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("students.addFirstStudent")}
            </p>
            <Link href={`/${locale}/dashboard/${departmentSlug}/students/new`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 px-6">
                <Plus className="h-5 w-5 mr-2" />
                {t("students.addStudent")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-3">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/${locale}/dashboard/${departmentSlug}/students/${student.id}`}
              >
                <StudentCard student={student} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
