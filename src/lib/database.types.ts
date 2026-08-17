export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string
          district: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          reference: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          district?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          reference?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          district?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          reference?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      service_order: {
        Row: {
          amount_paid: number | null
          client_id: string
          created_at: string
          created_by: string
          discount: number
          id: string
          number: string
          opened_at: string
          paid: boolean
          report: string | null
          request: string | null
          settled_at: string | null
          status: Database["public"]["Enums"]["service_order_status"]
          updated_at: string
          updated_by: string
          warranty_months: number | null
        }
        Insert: {
          amount_paid?: number | null
          client_id: string
          created_at?: string
          created_by: string
          discount?: number
          id?: string
          number: string
          opened_at?: string
          paid?: boolean
          report?: string | null
          request?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          updated_at?: string
          updated_by: string
          warranty_months?: number | null
        }
        Update: {
          amount_paid?: number | null
          client_id?: string
          created_at?: string
          created_by?: string
          discount?: number
          id?: string
          number?: string
          opened_at?: string
          paid?: boolean
          report?: string | null
          request?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          updated_at?: string
          updated_by?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_item: {
        Row: {
          description: string
          id: string
          order_id: string
          position: number
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          order_id: string
          position: number
          quantity?: number
          unit_price?: number
        }
        Update: {
          description?: string
          id?: string
          order_id?: string
          position?: number
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_item_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_order"
            referencedColumns: ["id"]
          },
        ]
      }
      trip: {
        Row: {
          arrived_at: string | null
          back_shop_at: string | null
          date: string | null
          id: string
          km_end: number | null
          km_start: number | null
          left_client_at: string | null
          left_shop_at: string | null
          order_id: string
          position: number
          signed_by: string | null
          vehicle: string | null
        }
        Insert: {
          arrived_at?: string | null
          back_shop_at?: string | null
          date?: string | null
          id?: string
          km_end?: number | null
          km_start?: number | null
          left_client_at?: string | null
          left_shop_at?: string | null
          order_id: string
          position: number
          signed_by?: string | null
          vehicle?: string | null
        }
        Update: {
          arrived_at?: string | null
          back_shop_at?: string | null
          date?: string | null
          id?: string
          km_end?: number | null
          km_start?: number | null
          left_client_at?: string | null
          left_shop_at?: string | null
          order_id?: string
          position?: number
          signed_by?: string | null
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_order"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      service_order_status: "open" | "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      service_order_status: ["open", "in_progress", "completed"],
    },
  },
} as const

