import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
};

export default async function NewTeacherPage({ params }: Props) {
  const { locale, departmentSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("teachers");

  const supabase = await createClient();
  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", departmentSlug)
    .single();

  if (!department) notFound();

  return (
    <>
      <Header
        title={t("addTeacher")}
        backHref={`/${locale}/dashboard/${departmentSlug}/teachers`}
      />
      <main className="flex-1 p-4 lg:p-6">
        <TeacherForm departmentId={department.id} departmentSlug={departmentSlug} />
      </main>
    </>
  );
}
