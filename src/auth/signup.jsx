// src/auth/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/init-firebase';
import toast, { Toaster } from 'react-hot-toast';
import '../css/auth.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('🎉 Account created! Redirecting...');
      setTimeout(() => navigate('/upload/closet'), 1000); // smooth transition
    } catch (err) {
      toast.error(`Signup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toaster position="top-right" />

      <div className="auth-card">
        <h2>📝 Create an Account</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          className="auth-input"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={confirmPassword}
          className="auth-input"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
          />
          Show Password
        </label>

        <button className="button-base auth-button" onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="auth-link">
          Already have an account? <a href="/login">Log in here</a>
        </p>
      </div>
    </div>
  );
}
