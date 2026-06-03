import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ApiError } from '../api/client';
import './LoginPage.css';

export function LoginPage() {
  const { login, token, user, initializing } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated as a dashboard user -> go straight in.
  if (!initializing && token && user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      if (u.role === 'SALES') {
        // Logged in fine, but no dashboard access — let the guard show the
        // friendly message.
        navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">YF</span>
          <div>
            <h1>YourFin Rider</h1>
            <p>Executive Dashboard</p>
          </div>
        </div>

        <form className="login-form card card-pad" onSubmit={onSubmit}>
          <h2 className="login-title">เข้าสู่ระบบ</h2>
          <p className="login-desc muted">
            สำหรับผู้จัดการและผู้ดูแลระบบเท่านั้น
          </p>

          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@yourfin.co"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={submitting}
          >
            {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>

          <div className="login-hint">
            <strong>บัญชีทดสอบ (ผู้จัดการ)</strong>
            <code>manager@yourfin.co</code>
            <code>manager1234</code>
          </div>
        </form>
      </div>
    </div>
  );
}
