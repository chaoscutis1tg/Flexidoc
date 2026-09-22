import axios from 'axios';

const SECRET_KEY_STR = 'mt_ctms_super_secret_jwt_key_2026_change_in_production';

async function decryptPayloadBrowser(encryptedStr) {
  try {
    if (!encryptedStr || typeof encryptedStr !== 'string' || !encryptedStr.includes(':')) {
      return null;
    }
    const [ivB64, encB64] = encryptedStr.split(':');
    const encoder = new TextEncoder();
    const keyData = await window.crypto.subtle.digest('SHA-256', encoder.encode(SECRET_KEY_STR));

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(encB64), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      ciphertext
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (err) {
    console.error('[API] Decryption error:', err);
    return null;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  async (response) => {
    let data = response.data;
    if (data && data.encrypted && data.payload) {
      const decrypted = await decryptPayloadBrowser(data.payload);
      if (decrypted) {
        data = decrypted;
      }
    }
    return data;
  },
  async (error) => {
    let errData = error.response?.data;
    if (errData && errData.encrypted && errData.payload) {
      const decrypted = await decryptPayloadBrowser(errData.payload);
      if (decrypted) {
        errData = decrypted;
      }
    }
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register') || error.config?.url?.includes('/auth/google');
      if (!isAuthUrl) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    const message = errData?.message || 'Có lỗi kết nối hệ thống';
    return Promise.reject(new Error(message));
  }
);

export default api;
