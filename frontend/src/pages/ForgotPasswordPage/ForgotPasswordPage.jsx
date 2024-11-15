import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:2610/api/v1/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage("Password reset link sent successfully. Please check your email.");
        setTimeout(() => navigate("/signin"), 3000); // Redirect after 3 seconds
      } else {
        setMessage("Failed to send password reset link. Please try again.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again later.");
      console.error("An error occurred", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-blue-100">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-900">
          Forgot Password
        </h2>
        <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded relative block w-full px-3 py-2 border border-blue-300 placeholder-blue-500 text-blue-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          {message && <p className="text-center mt-4 text-sm text-blue-700">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
