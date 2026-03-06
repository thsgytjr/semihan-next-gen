"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTeacher(
  displayName: string,
  campus: string | null,
  serviceSlot: string | null,
  departmentId: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").insert({
    display_name: displayName,
    role: "teacher",
    department_id: departmentId,
    campus: campus || null,
    service_slot: serviceSlot || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTeacher(
  teacherId: string,
  displayName: string,
  campus: string | null,
  serviceSlot: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, campus: campus || null, service_slot: serviceSlot || null })
    .eq("id", teacherId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function assignTeacherToClass(
  teacherId: string,
  classTag: string,
  departmentId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({ teacher_id: teacherId })
    .eq("class_tag", classTag)
    .eq("department_id", departmentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function unassignTeacherFromStudent(studentId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({ teacher_id: null })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateClassTagColor(
  departmentId: string,
  tagName: string,
  color: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("class_tags")
    .upsert(
      { department_id: departmentId, name: tagName, color },
      { onConflict: "department_id,name" }
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

