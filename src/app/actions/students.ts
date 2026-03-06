"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function extractStoragePath(publicUrl: string): string | null {
  const match = publicUrl.split("/student-photos/")[1];
  return match ? decodeURIComponent(match.split("?")[0]) : null;
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const departmentId = formData.get("department_id") as string;
  const birthDate = formData.get("birth_date") as string;
  const notes = formData.get("notes") as string;
  const classTag = formData.get("class_tag") as string;
  const teacherId = formData.get("teacher_id") as string;
  const parentName = formData.get("parent_name") as string;
  const parentPhone = formData.get("parent_phone") as string;
  const graduationDate = formData.get("graduation_date") as string;
  const prayerRequest = formData.get("prayer_request") as string;
  const serviceSlot = formData.get("service_slot") as string;
  const campus = formData.get("campus") as string;
  const photoFile = formData.get("photo") as File | null;

  let photoUrl: string | null = null;

  if (photoFile && photoFile.size > 0) {
    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${departmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(fileName, photoFile, { cacheControl: "3600", upsert: false });

    if (uploadError) return { error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(fileName);
    photoUrl = publicUrl;
  }

  if (classTag) {
    await supabase
      .from("class_tags")
      .upsert({ department_id: departmentId, name: classTag, color: '#22c55e' }, { ignoreDuplicates: true, onConflict: 'department_id,name' });
  }

  const { error } = await supabase.from("students").insert({
    name,
    department_id: departmentId,
    birth_date: birthDate || null,
    notes: notes || null,
    class_tag: classTag || null,
    teacher_id: teacherId || null,
    parent_name: parentName || null,
    parent_phone: parentPhone || null,
    graduation_date: graduationDate || null,
    prayer_request: prayerRequest || null,
    service_slot: serviceSlot || null,
    campus: campus || null,
    photo_url: photoUrl,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudent(studentId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const birthDate = formData.get("birth_date") as string;
  const notes = formData.get("notes") as string;
  const classTag = formData.get("class_tag") as string;
  const teacherId = formData.get("teacher_id") as string;
  const parentName = formData.get("parent_name") as string;
  const parentPhone = formData.get("parent_phone") as string;
  const graduationDate = formData.get("graduation_date") as string;
  const prayerRequest = formData.get("prayer_request") as string;
  const serviceSlot = formData.get("service_slot") as string;
  const campus = formData.get("campus") as string;
  const photoFile = formData.get("photo") as File | null;
  const existingPhotoUrl = formData.get("existing_photo_url") as string;
  const removePhoto = formData.get("remove_photo") === "true";
  const departmentId = formData.get("department_id") as string;

  let photoUrl: string | null = existingPhotoUrl || null;

  if (removePhoto && existingPhotoUrl) {
    const oldPath = extractStoragePath(existingPhotoUrl);
    if (oldPath) await supabase.storage.from("student-photos").remove([oldPath]);
    photoUrl = null;
  } else if (photoFile && photoFile.size > 0) {
    if (existingPhotoUrl) {
      const oldPath = extractStoragePath(existingPhotoUrl);
      if (oldPath) await supabase.storage.from("student-photos").remove([oldPath]);
    }

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${departmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(fileName, photoFile, { cacheControl: "3600", upsert: false });

    if (uploadError) return { error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from("student-photos").getPublicUrl(fileName);
    photoUrl = publicUrl;
  }

  const { error } = await supabase
    .from("students")
    .update({
      name,
      birth_date: birthDate || null,
      notes: notes || null,
      class_tag: classTag || null,
      teacher_id: teacherId || null,
      parent_name: parentName || null,
      parent_phone: parentPhone || null,
      graduation_date: graduationDate || null,
      prayer_request: prayerRequest || null,
      service_slot: serviceSlot || null,
      campus: campus || null,
      photo_url: photoUrl,
    })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkCreateStudents(
  names: string[],
  departmentId: string,
  opts: { classTag?: string; teacherId?: string; serviceSlot?: string; campus?: string }
) {
  const supabase = await createClient();

  const rows = names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      department_id: departmentId,
      class_tag: opts.classTag || null,
      teacher_id: opts.teacherId || null,
      service_slot: opts.serviceSlot || null,
      campus: opts.campus || null,
    }));

  if (rows.length === 0) return { error: "이름을 입력해주세요" };

  const { error } = await supabase.from("students").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true, count: rows.length };
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("photo_url")
    .eq("id", studentId)
    .single();

  if (student?.photo_url) {
    const storagePath = extractStoragePath(student.photo_url);
    if (storagePath) await supabase.storage.from("student-photos").remove([storagePath]);
  }

  // Soft delete
  const { error } = await supabase
    .from("students")
    .update({ is_active: false })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
