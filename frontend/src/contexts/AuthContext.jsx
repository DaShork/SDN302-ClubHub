import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem("clubhub_role") || "Student";
  });

  const [user, setUser] = useState({
    student_id: "HE150123",
    name: "Nguyen Van An",
    email: "annvhe150123@fpt.edu.vn",
    role: role,
    club_name: role === "Club Leader" ? "JS Club (Javascript Club)" : null
  });

  const changeRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem("clubhub_role", newRole);
  };

  useEffect(() => {
    setUser({
      student_id: "HE150123",
      name: "Nguyen Van An",
      email: "annvhe150123@fpt.edu.vn",
      role: role,
      club_name: role === "Club Leader" ? "JS Club (Javascript Club)" : null
    });
  }, [role]);

  return (
    <AuthContext.Provider value={{ user, role, changeRole }}>
      {children}
    </AuthContext.Provider>
  );
};
