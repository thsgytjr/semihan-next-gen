import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { BulkAddForm } from "@/components/students/bulk-add-form";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
};

export default async function BulkAddStudentsPage({ params }: Props) {
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

  const [{ data: tagRows }, { data: teacherRows }] = await Promise.all([
    supabase
      .from("students")
      .select("class_tag")
      .eq("department_id", department.id)
      .eq("is_active", true)
      .not("class_tag", "is", null),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("department_id", department.id)
      .order("display_name"),
  ]);

  const existingTags = [...new Set((tagRows ?? []).map((r) => r.class_tag as string))].sort();
  const teachers = teacherRows ?? [];

  return (
    <>
      <Header title={t("students.bulkAddTitle")} />
      <main className="flex-1 p-4 lg:p-6">
        <BulkAddForm
          departmentId={department.id}
          departmentSlug={departmentSlug}
          existingTags={existingTags}
          teachers={teachers}
        />
      </main>
    </>
  );
}
