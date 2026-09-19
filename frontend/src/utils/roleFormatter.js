import React from 'react';
import { Crown, ShieldCheck, UserCheck, Eye, User } from 'lucide-react';

/**
 * Friendly Vietnamese Role Formatter for UI Display
 */
export const getRoleInfo = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        label: 'Quản Trị Tối Cao',
        shortLabel: 'Super Admin',
        color: '#ffffff',
        bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
        badgeBg: '#eef2ff',
        badgeColor: '#4338ca',
        border: '#c7d2fe',
        Icon: ShieldCheck,
      };
    case 'ORGANIZATION_ADMIN':
      return {
        label: 'Quản Trị Viên Tổ Chức',
        shortLabel: 'Quản Trị Viên',
        color: '#ffffff',
        bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        border: '#bae6fd',
        Icon: Crown,
      };
    case 'STAFF':
      return {
        label: 'Nhân Viên Nghiệp Vụ',
        shortLabel: 'Nhân Viên',
        color: '#15803d',
        bg: '#dcfce7',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        border: '#bbf7d0',
        Icon: UserCheck,
      };
    case 'VIEWER':
      return {
        label: 'Tài Khoản Chỉ Xem',
        shortLabel: 'Chỉ Xem',
        color: '#475569',
        bg: '#f1f5f9',
        badgeBg: '#f1f5f9',
        badgeColor: '#475569',
        border: '#cbd5e1',
        Icon: Eye,
      };
    default:
      return {
        label: role || 'Thành Viên',
        shortLabel: role || 'Thành Viên',
        color: '#475569',
        bg: '#f1f5f9',
        badgeBg: '#f1f5f9',
        badgeColor: '#475569',
        border: '#cbd5e1',
        Icon: User,
      };
  }
};
