import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function Layout({
  currentPage,
  onNavigate,
  children,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen bg-stone-50">
      <aside className="w-64 bg-amber-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-amber-700">
          Quản lý SX
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => onNavigate("products")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              currentPage === "products"
                ? "bg-amber-700"
                : "hover:bg-amber-700"
            }`}
          >
            Sản phẩm
          </button>
          <button
            onClick={() => onNavigate("orders")}
            className={`w-full text-left px-4 py-2 rounded-lg ${
              currentPage === "orders" ? "bg-amber-700" : "hover:bg-amber-700"
            }`}
          >
            Đơn hàng
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onNavigate("workers")}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === "workers"
                    ? "bg-amber-700"
                    : "hover:bg-amber-700"
                }`}
              >
                Nhân công
              </button>
              <button
                onClick={() => onNavigate("inventory")}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  currentPage === "inventory"
                    ? "bg-amber-700"
                    : "hover:bg-amber-700"
                }`}
              >
                Kho
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-amber-700">
          <div className="flex items-center justify-between">
            <span className="text-sm">{user?.email}</span>
            <button
              onClick={logout}
              className="p-2 bg-amber-700 rounded-lg hover:bg-amber-900 transition"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
