import re

with open('src/layouts/DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the button containing "Quản lý / gia hạn gói dịch vụ"
title_idx = content.find('Quản lý / gia hạn gói dịch vụ')
if title_idx == -1:
    print('title not found')
    exit(1)

start_idx = content.rfind('<button', 0, title_idx)
end_idx = content.find('</button>', title_idx)

if start_idx == -1 or end_idx == -1:
    print('start or end not found')
    exit(1)

new_content = """<button
                onClick={() => setRenewalModalOpen(true)}
                className="hidden md:flex items-center gap-2 transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]"
                style={{
                  background: isExpired ? '#fff1f2' : plan === 'FREE' ? '#f0f9ff' : 'linear-gradient(to right, #ffffff, #faf5ff)',
                  border: `1px solid ${isExpired ? '#fecdd3' : plan === 'FREE' ? '#bae6fd' : '#e9d5ff'}`,
                  borderRadius: '100px',
                  padding: '4px 4px 4px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  marginRight: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = isExpired
                    ? '0 4px 12px rgba(225, 29, 72, 0.12)'
                    : plan === 'FREE'
                      ? '0 4px 12px rgba(2, 132, 199, 0.12)'
                      : '0 4px 12px rgba(147, 51, 234, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
                title={`Quản lý / nâng cấp gói dịch vụ cho tổ chức '${user?.organizationId?.name || 'hiện tại'}'`}
              >
                {/* Plan Info */}
                <div className="flex items-center gap-2">
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isExpired ? '#ffe4e6' : plan === 'FREE' ? '#e0f2fe' : '#f3e8ff',
                    width: '24px', height: '24px', borderRadius: '50%'
                  }}>
                    {isExpired ? (
                      <AlertTriangle size={13} color="#e11d48" />
                    ) : (
                      <Crown size={13} color={plan === 'FREE' ? '#0284c7' : '#9333ea'} />
                    )}
                  </div>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '13px',
                    letterSpacing: '0.03em',
                    color: isExpired ? '#be123c' : plan === 'FREE' ? '#0284c7' : '#7e22ce'
                  }}>
                    {plan}
                  </span>
                </div>

                {/* Status/Days Pill */}
                <div style={{
                  background: isExpired 
                    ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' 
                    : plan === 'FREE' 
                      ? 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' 
                      : 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                  color: 'white',
                  borderRadius: '100px',
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '700',
                  fontSize: '11.5px',
                  boxShadow: isExpired 
                    ? '0 2px 6px rgba(225, 29, 72, 0.25)' 
                    : plan === 'FREE' 
                      ? '0 2px 6px rgba(2, 132, 199, 0.25)' 
                      : '0 2px 6px rgba(126, 34, 206, 0.25)'
                }}>
                  {isExpired ? (
                    <>
                      <AlertTriangle size={12} color="#ffffff" />
                      <span>Hết Hạn</span>
                    </>
                  ) : plan === 'FREE' ? (
                    <>
                      <Sparkles size={12} color="#ffffff" />
                      <span>Nâng Cấp</span>
                    </>
                  ) : (
                    <>
                      <Clock size={12} color="#ffffff" />
                      <span>Còn {daysRemaining} ngày</span>
                    </>
                  )}
                </div>
"""

content = content[:start_idx] + new_content + content[end_idx:]

with open('src/layouts/DashboardLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('done')
