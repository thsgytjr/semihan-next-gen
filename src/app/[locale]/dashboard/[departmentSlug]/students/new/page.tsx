import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StudentForm } from "@/components/students/student-form";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
};

export default async function NewStudentPage({ params }: Props) {
  const { locale, departmentSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", departmentSlug)
    .single();

  if (!department) {
    return <div>Department not found</div>;
  }

  return (
    <>
      <Header title={t("students.addStudent")} />
      <main className="flex-1 p-4 lg:p-6">
        <StudentForm departmentId={department.id} />
      </main>
    </>
  );
}
