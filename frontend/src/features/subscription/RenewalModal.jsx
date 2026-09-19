import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { fetchDynamicPlans, DEFAULT_PLANS_DATA } from '../../utils/planData';
import { 
  X, 
  Crown, 
  Check, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Building,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const RenewalModal = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState(DEFAULT_PLANS_DATA);
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDynamicPlans().then(data => {
        if (data && data.length > 0) {
          // Filter out FREE for upgrade modal
          const commercialPlans = data.filter(p => p.code !== 'FREE');
          if (commercialPlans.length > 0) {
            setPlans(commercialPlans);
          }
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmRenew = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/organizations/renew-subscription', { planName: selectedPlan });
      if (res.success) {
        setSuccessMsg(`Đã gia hạn / nâng cấp thành công gói ${selectedPlan} cho tổ chức '${currentOrg.name || 'chính bạn'}'! Hạn dùng mới: 30 ngày.`);
        await refreshUser();
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gia hạn thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const currentOrg = user?.organizationId || {};
  const currentSelectedPlanObj = plans.find(p => p.code === selectedPlan) || plans[0];

  return (
    <div className="modal-overlay animate-backdrop" style={{ zIndex: 10000 }}>
      <div 
        className="modal-content animate-modal-pop" 
        style={{ 
          maxWidth: '820px', 
          width: '94vw', 
          padding: '28px 32px', 
          borderRadius: '20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header - Clean Enterprise SaaS Style */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={22} className="text-sky-600" /> Nâng Cấp Gói Dịch Vụ Cho Tổ Chức Của Bạn
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
              <span>Tổ chức hiện tại đang sử dụng:</span>
              <span style={{ fontWeight: '700', color: '#0369a1', background: '#f0f9ff', padding: '3px 10px', borderRadius: '8px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Building size={14} /> {currentOrg.name || 'Tổ chức của tôi'} ({currentOrg.code || 'MAIN'})
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              color: '#64748b', 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {successMsg && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#166534', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <CheckCircle2 size={18} color="#16a34a" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#991b1b', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <AlertCircle size={18} color="#dc2626" /> {errorMsg}
          </div>
        )}

        {/* Dynamic Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {plans.map((p) => {
            const isSelected = selectedPlan === p.code;
            const isPro = p.code === 'PRO';
            const isVip = p.code === 'VIP';

            return (
              <div 
                key={p.code}
                onClick={() => setSelectedPlan(p.code)}
                style={{ 
                  borderRadius: '16px', 
                  padding: '22px 18px', 
                  cursor: 'pointer',
                  position: 'relative',
                  background: isSelected 
                    ? (isVip ? '#faf5ff' : isPro ? '#f0f9ff' : '#f8fafc') 
                    : '#ffffff',
                  border: isSelected 
                    ? `2px solid ${isVip ? '#9333ea' : isPro ? '#0284c7' : '#0284c7'}` 
                    : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 8px 20px rgba(2, 132, 199, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Popular Tag */}
                {p.popular && (
                  <div style={{ position: 'absolute', top: '-11px', right: '16px', background: '#0284c7', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '2px 10px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {p.popularBadgeText || 'Phổ Biến Nhất'}
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: isVip ? '#7e22ce' : '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {p.subtitle || p.badge}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                    {p.title}
                  </h3>

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: isVip ? '#7e22ce' : '#0284c7' }}>
                      {p.formattedPrice}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                      {p.billingCycle}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                    {p.features && p.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4' }}>
                        <Check size={16} style={{ color: isVip ? '#9333ea' : '#10b981', flexShrink: 0, marginTop: '1px' }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>

        {/* Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '18px', flexWrap: 'nowrap' }}>
          <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
            <ShieldCheck size={16} color="#0284c7" style={{ flexShrink: 0 }} />
            <span>Hạn sử dụng sẽ được <strong>tự động cộng dồn +30 ngày</strong> kể từ hôm nay.</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <button 
              type="button" 
              className="btn-action btn-secondary" 
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '10px', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: '600' }}
            >
              Hủy Bỏ
            </button>

            <button 
              type="button"
              disabled={loading}
              className="btn-action"
              onClick={handleConfirmRenew}
              style={{ 
                background: selectedPlan === 'VIP' ? '#9333ea' : '#0284c7', 
                color: '#ffffff',
                padding: '10px 22px', 
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '13.5px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Crown size={16} /> {loading ? 'Đang Xử Lý...' : `Xác Nhận & Kích Hoạt Gói ${selectedPlan}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

