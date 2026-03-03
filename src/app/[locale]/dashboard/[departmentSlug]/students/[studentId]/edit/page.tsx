import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StudentForm } from "@/components/students/student-form";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string; studentId: string }>;
};

export default async function EditStudentPage({ params }: Props) {
  const { locale, departmentSlug, studentId } = await params;
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

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) {
    notFound();
  }

  return (
    <>
      <Header title={t("students.editStudent")} />
      <main className="flex-1 p-4 lg:p-6">
        <StudentForm departmentId={department.id} student={student} />
      </main>
    </>
  );
}
