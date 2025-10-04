/*
  # Furniture Production Management System Schema

  1. New Tables
    - `products` - Quản lý sản phẩm bàn ghế gỗ
      - `id` (uuid, primary key)
      - `code` (text, unique) - Mã sản phẩm
      - `name` (text) - Tên sản phẩm
      - `wood_type` (text) - Loại gỗ
      - `dimensions` (text) - Kích thước
      - `price` (numeric) - Giá bán
      - `production_status` (text) - Tình trạng sản xuất (pending, in_production, completed)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `orders` - Quản lý đơn hàng
      - `id` (uuid, primary key)
      - `order_number` (text, unique) - Số đơn hàng
      - `customer_name` (text) - Tên khách hàng
      - `delivery_date` (date) - Ngày giao hàng
      - `status` (text) - Trạng thái (pending, in_production, completed)
      - `total_amount` (numeric) - Tổng tiền
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_items` - Chi tiết sản phẩm trong đơn hàng
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer) - Số lượng
      - `unit_price` (numeric) - Đơn giá
      - `created_at` (timestamptz)

    - `workers` - Quản lý nhân công
      - `id` (uuid, primary key)
      - `name` (text) - Tên nhân viên
      - `position` (text) - Vị trí
      - `shift` (text) - Ca làm việc (morning, afternoon, night)
      - `completed_products` (integer) - Số sản phẩm đã hoàn thành
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `work_assignments` - Phân công công việc
      - `id` (uuid, primary key)
      - `worker_id` (uuid, foreign key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `assigned_date` (date) - Ngày phân công
      - `status` (text) - Trạng thái (assigned, in_progress, completed)
      - `created_at` (timestamptz)

    - `inventory` - Quản lý kho nguyên liệu
      - `id` (uuid, primary key)
      - `wood_code` (text, unique) - Mã gỗ
      - `wood_type` (text) - Loại gỗ
      - `quantity` (numeric) - Khối lượng
      - `unit` (text) - Đơn vị tính (m3, kg, board)
      - `current_stock` (numeric) - Tồn kho hiện tại
      - `min_stock` (numeric) - Mức tồn kho tối thiểu
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `inventory_transactions` - Giao dịch nhập/xuất kho
      - `id` (uuid, primary key)
      - `inventory_id` (uuid, foreign key)
      - `transaction_type` (text) - Loại giao dịch (import, export)
      - `quantity` (numeric) - Số lượng
      - `reference_number` (text) - Số chứng từ
      - `notes` (text) - Ghi chú
      - `transaction_date` (timestamptz)
      - `created_at` (timestamptz)

    - `user_profiles` - Thông tin người dùng
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (text) - Vai trò (admin, employee)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Admin has full access, employees have limited access

  3. Important Notes
    - All monetary values use numeric type for precision
    - Status fields use text with check constraints for validation
    - Timestamps use timestamptz for timezone awareness
    - Foreign keys ensure referential integrity
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  wood_type text NOT NULL,
  dimensions text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  production_status text NOT NULL DEFAULT 'pending' CHECK (production_status IN ('pending', 'in_production', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  delivery_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'completed')),
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  shift text NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
  completed_products integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create work_assignments table
CREATE TABLE IF NOT EXISTS work_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wood_code text UNIQUE NOT NULL,
  wood_type text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'm3' CHECK (unit IN ('m3', 'kg', 'board')),
  current_stock numeric(10,2) NOT NULL DEFAULT 0,
  min_stock numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('import', 'export')),
  quantity numeric(10,2) NOT NULL CHECK (quantity > 0),
  reference_number text,
  notes text,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(production_status);
CREATE INDEX IF NOT EXISTS idx_products_wood_type ON products(wood_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_worker_id ON work_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_status ON work_assignments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for orders
CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Authenticated users can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for workers
CREATE POLICY "Authenticated users can view workers"
  ON workers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage workers"
  ON workers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for work_assignments
CREATE POLICY "Authenticated users can view work assignments"
  ON work_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage work assignments"
  ON work_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for inventory
CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for inventory_transactions
CREATE POLICY "Authenticated users can view inventory transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage inventory transactions"
  ON inventory_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update inventory stock after transaction
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'import' THEN
    UPDATE inventory
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.inventory_id;
  ELSIF NEW.transaction_type = 'export' THEN
    UPDATE inventory
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.inventory_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory transactions
CREATE TRIGGER update_inventory_stock_trigger AFTER INSERT ON inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();