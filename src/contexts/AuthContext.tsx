import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  email: string;
  role: "admin" | "employee";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Giả lập đăng nhập
    if (email === "admin@example.com" && password === "password123") {
      setUser({ email, role: "admin" });
      return { error: null };
    } else if (email === "employee@example.com" && password === "password123") {
      setUser({ email, role: "employee" });
      return { error: null };
    } else {
      return { error: "Sai tài khoản hoặc mật khẩu" };
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider");
  return context;
};
