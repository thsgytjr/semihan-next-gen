"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStudent(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const departmentId = formData.get("department_id") as string;
  const birthDate = formData.get("birth_date") as string;
  const notes = formData.get("notes") as string;
  const photoFile = formData.get("photo") as File | null;

  let photoUrl: string | null = null;

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${departmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(fileName, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("student-photos").getPublicUrl(fileName);

    photoUrl = publicUrl;
  }

  const { error } = await supabase.from("students").insert({
    name,
    department_id: departmentId,
    birth_date: birthDate || null,
    notes: notes || null,
    photo_url: photoUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateStudent(studentId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const birthDate = formData.get("birth_date") as string;
  const notes = formData.get("notes") as string;
  const photoFile = formData.get("photo") as File | null;
  const existingPhotoUrl = formData.get("existing_photo_url") as string;
  const departmentId = formData.get("department_id") as string;

  let photoUrl = existingPhotoUrl || null;

  // Upload new photo if provided
  if (photoFile && photoFile.size > 0) {
    // Delete old photo if exists
    if (existingPhotoUrl) {
      const oldPath = existingPhotoUrl.split("/student-photos/")[1];
      if (oldPath) {
        await supabase.storage.from("student-photos").remove([oldPath]);
      }
    }

    const fileExt = photoFile.name.split(".").pop();
    const fileName = `${departmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("student-photos")
      .upload(fileName, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("student-photos").getPublicUrl(fileName);

    photoUrl = publicUrl;
  }

  const { error } = await supabase
    .from("students")
    .update({
      name,
      birth_date: birthDate || null,
      notes: notes || null,
      photo_url: photoUrl,
    })
    .eq("id", studentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient();

  // Soft delete
  const { error } = await supabase
    .from("students")
    .update({ is_active: false })
    .eq("id", studentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
