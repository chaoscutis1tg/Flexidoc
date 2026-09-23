import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { Briefcase, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('123456');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
      padding: '20px',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        background: '#ffffff',
        boxShadow: '0 20px 40px rgba(2, 132, 199, 0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
            padding: '8px',
            overflow: 'hidden'
          }}>
            <img src="/logo.png" alt="FlexiDoc Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>Hệ Thống FlexiDoc</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Quản Lý & Sinh Hợp Đồng Theo Mẫu Đa Tổ Chức
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Email tài khoản
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="email"
                required
                className="glass-input"
                style={{ paddingLeft: '44px' }}
                placeholder="Nhập email của bạn (Ví dụ: admin@mtctms.vn)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="password"
                required
                className="glass-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-action btn-info" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px', height: '46px', fontSize: '15px' }}
          >
            {loading ? 'Đang xác thực...' : <>Đăng Nhập Hệ Thống <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
          <p style={{ marginBottom: '8px', fontWeight: '600' }}>Bấm vào tài khoản dùng thử để điền nhanh:</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('admin@mtctms.vn')}
              style={{ padding: '4px 10px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('orgadmin@abc.com')}
              style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
            >
              Quản Lý Tổ Chức
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('staff@abc-hn.com')}
              style={{ padding: '4px 10px', borderRadius: '12px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
            >
              Nhân Viên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
