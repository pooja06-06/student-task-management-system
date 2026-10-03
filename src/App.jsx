import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import {
  getCurrentUser,
  logoutUser,
} from "./services/authService";

export default function App() {
  const [user, setUser] = useState(
    getCurrentUser
  );

  const [authPage, setAuthPage] =
    useState("login");

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setAuthPage("login");
  };

  if (!user) {
    if (authPage === "register") {
      return (
        <Register
          onRegister={handleLogin}
          onLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    if (authPage === "forgot") {
      return (
        <ForgotPassword
          onLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() =>
          setAuthPage("register")
        }
        onForgotPassword={() =>
          setAuthPage("forgot")
        }
      />
    );
  }

  return (
    <Dashboard
      currentUser={user}
      onLogout={handleLogout}
    />
  );
}