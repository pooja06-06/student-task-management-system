import { useState } from "react";
import { resetPassword } from "../services/authService";

export default function ForgotPassword({
  onLogin,
}) {
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [step, setStep] = useState(1);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const handleEmail = (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    const users = JSON.parse(
      localStorage.getItem(
        "taskflow_users"
      ) || "[]"
    );

    const exists = users.some(
      (user) =>
        user.email ===
        email.trim().toLowerCase()
    );

    if (!exists) {
      setError(
        "No account was found for this email."
      );
      return;
    }

    setStep(2);
  };

  const handleReset = async (event) => {
    event.preventDefault();

    setError("");

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
      await resetPassword({
        email,
        newPassword: password,
      });

      setSuccess(
        "Password updated successfully."
      );

      setTimeout(() => {
        onLogin();
      }, 1000);
    } catch (err) {
      setError(
        err.message ||
          "Unable to reset password."
      );
    }
  };

  return (
    <div className="tf-auth-page">
      <div className="tf-auth-brand-panel">
        <div className="tf-auth-logo">🎓</div>

        <h1>TaskFlow</h1>

        <p>Student Portal</p>
      </div>

      <div className="tf-auth-form-panel">
        <form
          className="tf-auth-card"
          onSubmit={
            step === 1
              ? handleEmail
              : handleReset
          }
        >
          <div className="tf-auth-heading">
            <span>ACCOUNT RECOVERY</span>

            <h2>Reset your password</h2>

            <p>
              {step === 1
                ? "Enter your account email to continue."
                : "Create a new password for your account."}
            </p>
          </div>

          {step === 1 ? (
            <label className="tf-auth-field">
              <span>Email address</span>

              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="you@example.com"
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />
            </label>
          ) : (
            <>
              <label className="tf-auth-field">
                <span>New password</span>

                <input
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="tf-auth-field">
                <span>
                  Confirm new password
                </span>

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
            </>
          )}

          {error && (
            <div className="tf-auth-error">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="tf-auth-success">
              ✓ {success}
            </div>
          )}

          <button
            type="submit"
            className="tf-auth-submit"
          >
            {step === 1
              ? "Continue"
              : "Reset Password"}
          </button>

          <button
            type="button"
            className="tf-auth-secondary"
            onClick={onLogin}
          >
            Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );
}