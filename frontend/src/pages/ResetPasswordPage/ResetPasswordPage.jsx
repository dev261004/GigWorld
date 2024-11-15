import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const { token } = useParams(); // Retrieve the token from the URL
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:2610/api/v1/users/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        setMessage("Password reset successfully. Redirecting to sign-in...");
        setTimeout(() => navigate("/signin"), 3000); // Redirect after 3 seconds
      } else {
        setMessage("Failed to reset password. The link may be expired or invalid.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setMessage("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-blue-100">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-900">
          Reset Password
        </h2>
        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div>
            <label htmlFor="new-password" className="sr-only">
              New Password
            </label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="appearance-none rounded relative block w-full px-3 py-2 border border-blue-300 placeholder-blue-500 text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none rounded relative block w-full px-3 py-2 border border-blue-300 placeholder-blue-500 text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          {message && <p className="text-center mt-4 text-sm text-blue-700">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
