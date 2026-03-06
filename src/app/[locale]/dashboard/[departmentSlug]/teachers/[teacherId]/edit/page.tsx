import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string; teacherId: string }>;
};

export default async function EditTeacherPage({ params }: Props) {
  const { locale, departmentSlug, teacherId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("teachers");

  const supabase = await createClient();

  const [{ data: department }, { data: teacher }] = await Promise.all([
    supabase.from("departments").select("id").eq("slug", departmentSlug).single(),
    supabase.from("profiles").select("*").eq("id", teacherId).single(),
  ]);

  if (!department || !teacher) notFound();

  return (
    <>
      <Header
        title={t("editTeacher")}
        backHref={`/${locale}/dashboard/${departmentSlug}/teachers/${teacherId}`}
      />
      <main className="flex-1 p-4 lg:p-6">
        <TeacherForm
          departmentId={department.id}
          departmentSlug={departmentSlug}
          teacher={teacher}
        />
      </main>
    </>
  );
}
