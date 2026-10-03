import { useState } from "react";
import { loginUser } from "../services/authService";

export default function Login({
  onLogin,
  onRegister,
  onForgotPassword,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const user = await loginUser({
        email,
        password,
      });

      onLogin(user);
    } catch (err) {
      setError(
        err.message || "Unable to sign in."
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
          <div>✓ Manage academic tasks</div>
          <div>✓ Organize deadlines</div>
          <div>✓ Generate PDF study material</div>
          <div>✓ Practice with quizzes & flashcards</div>
        </div>
      </div>

      <div className="tf-auth-form-panel">
        <form
          className="tf-auth-card"
          onSubmit={handleSubmit}
        >
          <div className="tf-auth-heading">
            <span>WELCOME BACK</span>

            <h2>Sign in</h2>

            <p>
              Sign in to continue managing your
              studies.
            </p>
          </div>

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
                autoComplete="current-password"
                placeholder="Enter your password"
                onChange={(event) =>
                  setPassword(event.target.value)
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
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
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
              ? "Signing in..."
              : "Sign In"}
          </button>

          <button
            type="button"
            className="tf-auth-link-button"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>

          <div className="tf-auth-divider">
            <span>New to TaskFlow?</span>
          </div>

          <button
            type="button"
            className="tf-auth-secondary"
            onClick={onRegister}
          >
            Create an account
          </button>
        </form>
      </div>
    </div>
  );
}