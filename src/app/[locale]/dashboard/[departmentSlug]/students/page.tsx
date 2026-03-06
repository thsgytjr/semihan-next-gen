import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { StudentCard } from "@/components/students/student-card";
import { StudentClassFilter } from "@/components/students/student-class-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
  searchParams: Promise<{ tag?: string; service?: string; campus?: string }>;
};

export default async function StudentsPage({ params, searchParams }: Props) {
  const { locale, departmentSlug } = await params;
  const { tag: selectedTag, service: selectedService, campus: selectedCampus } = await searchParams;
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

  // Get all active students
  const { data: allStudents } = await supabase
    .from("students")
    .select("*")
    .eq("department_id", department.id)
    .eq("is_active", true)
    .order("name");

  const students = allStudents ?? [];

  // Fetch class tag colors
  const { data: classTagRows } = await supabase
    .from("class_tags")
    .select("name, color")
    .eq("department_id", department.id);

  const colorMap = new Map<string, string>(
    (classTagRows ?? []).map((r) => [r.name, r.color ?? "#22c55e"])
  );

  // Build unique campuses list
  const campusSet = new Set<string>();
  for (const s of students) {
    if (s.campus) campusSet.add(s.campus);
  }
  const campuses = Array.from(campusSet).sort();

  // Filter by campus
  let filtered = selectedCampus
    ? students.filter((s) => s.campus === selectedCampus)
    : students;

  // Build unique class tags with counts (from campus-filtered list)
  const tagMap = new Map<string, number>();
  for (const s of filtered) {
    if (s.class_tag) {
      tagMap.set(s.class_tag, (tagMap.get(s.class_tag) ?? 0) + 1);
    }
  }
  const classTags = Array.from(tagMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count, color: colorMap.get(name) ?? "#22c55e" }));

  // Filter by selected tag
  if (selectedTag) {
    filtered = filtered.filter((s) => s.class_tag === selectedTag);
  }

  // Check if any students in the selected class have service_slot
  const hasServiceSlots = filtered.some((s) => s.service_slot);

  // Filter by service slot (only when a class is selected)
  if (selectedTag && selectedService) {
    filtered = filtered.filter((s) => s.service_slot === selectedService);
  }

  return (
    <>
      <Header title={t("students.title")}>
        <Badge variant="secondary" className="text-xs font-semibold">
          {t("students.totalCount", { count: filtered.length })}
        </Badge>
        <Link href={`/${locale}/dashboard/${departmentSlug}/students/bulk`}>
          <Button size="sm" variant="outline" className="h-8 px-3 text-sm gap-1">
            <Users className="h-4 w-4" />
            {t("students.bulkAdd")}
          </Button>
        </Link>
        <Link href={`/${locale}/dashboard/${departmentSlug}/students/new`}>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("students.addStudent")}
          </Button>
        </Link>
      </Header>

      <main className="flex-1 p-4 lg:p-6 space-y-4">
        {(classTags.length > 0 || campuses.length > 0) && (
          <Suspense>
            <StudentClassFilter
              tags={classTags}
              totalCount={selectedCampus ? filtered.length : students.length}
              hasServiceSlots={hasServiceSlots}
              campuses={campuses}
              departmentId={department.id}
            />
          </Suspense>
        )}

        {filtered.length === 0 ? (
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
            {filtered.map((student) => (
              <Link
                key={student.id}
                href={`/${locale}/dashboard/${departmentSlug}/students/${student.id}`}
              >
                <StudentCard
                  student={student}
                  classTagColor={student.class_tag ? colorMap.get(student.class_tag) : undefined}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
