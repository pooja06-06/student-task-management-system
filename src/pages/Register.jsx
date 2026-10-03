import { useState } from "react";
import { registerUser } from "../services/authService";

export default function Register({
  onRegister,
  onLogin,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (name.trim().length < 2) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (!email.includes("@")) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const user = await registerUser({
        name,
        email,
        password,
      });

      onRegister(user);
    } catch (err) {
      setError(
        err.message ||
          "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tf-auth-page">
      <div className="tf-auth-brand-panel">
        <div className="tf-auth-logo">🎓</div>

        <h1>TaskFlow</h1>

        <p>Student Portal</p>

        <div className="tf-auth-feature-list">
          <div>✓ Organize your assignments</div>
          <div>✓ Track academic progress</div>
          <div>✓ Study from your PDFs</div>
          <div>✓ Stay focused</div>
        </div>
      </div>

      <div className="tf-auth-form-panel">
        <form
          className="tf-auth-card"
          onSubmit={handleSubmit}
        >
          <div className="tf-auth-heading">
            <span>GET STARTED</span>

            <h2>Create your account</h2>

            <p>
              Start organizing your academic
              work with TaskFlow.
            </p>
          </div>

          <label className="tf-auth-field">
            <span>Full name</span>

            <input
              type="text"
              value={name}
              autoComplete="name"
              placeholder="Your name"
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </label>

          <label className="tf-auth-field">
            <span>Email address</span>

            <input
              type="email"
              value={email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </label>

          <label className="tf-auth-field">
            <span>Password</span>

            <div className="tf-password-wrap">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </label>

          <label className="tf-auth-field">
            <span>Confirm password</span>

            <input
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              placeholder="Repeat your password"
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
            />
          </label>

          {error && (
            <div className="tf-auth-error">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="tf-auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

          <div className="tf-auth-divider">
            <span>Already have an account?</span>
          </div>

          <button
            type="button"
            className="tf-auth-secondary"
            onClick={onLogin}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}