export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      class_tags: {
        Row: {
          id: string;
          department_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          department_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          department_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_tags_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string;
          role: "admin" | "teacher";
          department_id: string | null;
          campus: string | null;
          service_slot: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          display_name: string;
          role?: "admin" | "teacher";
          department_id?: string | null;
          campus?: string | null;
          service_slot?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string;
          role?: "admin" | "teacher";
          department_id?: string | null;
          campus?: string | null;
          service_slot?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          name: string;
          photo_url: string | null;
          department_id: string;
          birth_date: string | null;
          notes: string | null;
          class_tag: string | null;
          teacher_id: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          graduation_date: string | null;
          prayer_request: string | null;
          service_slot: string | null;
          campus: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          photo_url?: string | null;
          department_id: string;
          birth_date?: string | null;
          notes?: string | null;
          class_tag?: string | null;
          teacher_id?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          graduation_date?: string | null;
          prayer_request?: string | null;
          service_slot?: string | null;
          campus?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          photo_url?: string | null;
          department_id?: string;
          birth_date?: string | null;
          notes?: string | null;
          class_tag?: string | null;
          teacher_id?: string | null;
          parent_name?: string | null;
          parent_phone?: string | null;
          graduation_date?: string | null;
          prayer_request?: string | null;
          service_slot?: string | null;
          campus?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          department_id: string;
          type: "sunday_worship" | "special";
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          department_id: string;
          type?: "sunday_worship" | "special";
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          date?: string;
          department_id?: string;
          type?: "sunday_worship" | "special";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          event_id: string;
          checked_in: boolean;
          checked_in_at: string;
          checked_in_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          event_id: string;
          checked_in?: boolean;
          checked_in_at?: string;
          checked_in_by?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          event_id?: string;
          checked_in?: boolean;
          checked_in_at?: string;
          checked_in_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_checked_in_by_fkey";
            columns: ["checked_in_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "teacher";
      event_type: "sunday_worship" | "special";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience types
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type ClassTag = Database["public"]["Tables"]["class_tags"]["Row"];
