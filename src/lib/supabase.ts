import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          code: string;
          name: string;
          wood_type: string;
          dimensions: string;
          price: number;
          production_status: 'pending' | 'in_production' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          delivery_date: string;
          status: 'pending' | 'in_production' | 'completed';
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      workers: {
        Row: {
          id: string;
          name: string;
          position: string;
          shift: 'morning' | 'afternoon' | 'night';
          completed_products: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workers']['Insert']>;
      };
      work_assignments: {
        Row: {
          id: string;
          worker_id: string;
          order_id: string;
          product_id: string;
          assigned_date: string;
          status: 'assigned' | 'in_progress' | 'completed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['work_assignments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['work_assignments']['Insert']>;
      };
      inventory: {
        Row: {
          id: string;
          wood_code: string;
          wood_type: string;
          quantity: number;
          unit: 'm3' | 'kg' | 'board';
          current_stock: number;
          min_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inventory']['Insert']>;
      };
      inventory_transactions: {
        Row: {
          id: string;
          inventory_id: string;
          transaction_type: 'import' | 'export';
          quantity: number;
          reference_number: string | null;
          notes: string | null;
          transaction_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inventory_transactions']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'employee';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
    };
  };
};
