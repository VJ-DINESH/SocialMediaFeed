import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Register = () => {
  const [user, setUser] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" }); // Stores success/error messages
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all fields are filled
    if (!user.username || !user.email || !user.password) {
      setMessage({ type: "danger", text: "❌ All fields are required!" });
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/register", user);
      setMessage({ type: "success", text: "✅ Registration successful! Redirecting..." });

      setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
    } catch (error) {
      // Handle different error scenarios
      const errorMsg = error.response?.data?.message || "❌ Registration failed. Try again.";
      setMessage({ type: "danger", text: errorMsg });
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-lg p-4">
            <h2 className="text-center mb-4">Register</h2>

            {/* Display Success or Error Message */}
            {message.text && (
              <div className={`alert alert-${message.type} text-center`} role="alert">
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  placeholder="Enter username"
                  value={user.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="Enter email"
                  value={user.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Enter password"
                  value={user.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Register
              </button>
            </form>

            <p className="mt-3 text-center">
              Already have an account? <a href="/login">Login here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
