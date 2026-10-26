import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.scss';

const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect directly to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-logo">🏠</div>
            <h1>EstateFlow CRM</h1>
            <p>Manage your real estate sales pipeline</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={isLoading || !email || !password}
            >
              {isLoading && <span className="btn-spinner" />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-demo">
            <div className="demo-title">Quick Demo Login</div>
            <div className="demo-accounts">
              <div
                className="demo-account"
                onClick={() => fillDemo('admin@estatecrm.com', 'admin123')}
              >
                <div className="demo-info">
                  <div className="demo-role">Admin Account</div>
                  <div className="demo-email">admin@estatecrm.com</div>
                </div>
                <span className="demo-arrow">→</span>
              </div>
              <div
                className="demo-account"
                onClick={() => fillDemo('priya@estatecrm.com', 'sales123')}
              >
                <div className="demo-info">
                  <div className="demo-role">Sales Employee</div>
                  <div className="demo-email">priya@estatecrm.com</div>
                </div>
                <span className="demo-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
