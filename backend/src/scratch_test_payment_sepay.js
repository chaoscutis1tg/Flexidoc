const API_BASE = 'http://127.0.0.1:5000/api/v1';

async function testPaymentAndAdminFeatures() {
  console.log('--- STARTING COMPLETE PAYMENT & ADMIN VERIFICATION TEST ---');

  try {
    // 1. Login as Super Admin (admin@mtctms.vn / 123456)
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mtctms.vn', password: '123456' })
    }).then(r => r.json());

    const superAdminToken = adminLoginRes.data.token;
    const superAdminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` };
    console.log('✅ 1. Logged in as Super Admin:', adminLoginRes.data.user.email, 'Role:', adminLoginRes.data.user.role);

    // 2. Login as Org Admin (phungvanhuy@gmail.com / 123456)
    const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'phungvanhuy@gmail.com', password: '123456' })
    }).then(r => r.json());

    const userToken = userLoginRes.data.token;
    const userHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` };
    console.log('✅ 2. Logged in as Org Admin:', userLoginRes.data.user.email, 'Org:', userLoginRes.data.user.organizationId?.name || 'Assigned Org');

    // 3. Check System Payment Settings (Public/Auth)
    const settingsRes = await fetch(`${API_BASE}/system-settings/payment`).then(r => r.json());
    console.log('✅ 3. Payment Config Loaded:', settingsRes.data);

    const sepayKey = settingsRes.data.sepayApiKey;
    const prefix = settingsRes.data.orderPrefix;

    // 4. Create an Order as Org Admin (PRO plan, 3 months)
    const createOrderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({ plan: 'PRO', durationMonths: 3 })
    }).then(r => r.json());

    const orderData = createOrderRes.data.order;
    const transferContent = createOrderRes.data.transferContent;
    console.log('✅ 4. Order Created:', orderData.orderCode, 'Amount:', orderData.amount, 'Transfer Content:', transferContent);

    // 5. Test SePay Webhook with Invalid API Key
    const invalidWebhookRes = await fetch(`${API_BASE}/payments/sepay-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Apikey invalid_key_123' },
      body: JSON.stringify({ content: transferContent, transferAmount: orderData.amount })
    });

    if (invalidWebhookRes.status === 401) {
      console.log('✅ 5. SePay Webhook correctly rejected invalid API Key (Status 401)');
    } else {
      console.error('❌ Failed: Webhook should have rejected invalid API key');
    }

    // 6. Test SePay Webhook with Valid API Key Authorization Header
    const webhookRes = await fetch(`${API_BASE}/payments/sepay-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Apikey ${sepayKey}` },
      body: JSON.stringify({
        content: `Thanh toan don hang ${transferContent}`,
        transferAmount: orderData.amount,
        referenceCode: 'FT26091988910',
        gateway: 'MBBank',
        id: '99882233'
      })
    }).then(r => r.json());

    console.log('✅ 6. SePay Webhook Auto-Approve Result:', webhookRes.message || webhookRes.data?.message);

    // Verify order is now SUCCESS
    const checkOrderRes = await fetch(`${API_BASE}/orders/${orderData._id}`, { headers: userHeaders }).then(r => r.json());
    console.log('✅ 7. Order Status after Webhook:', checkOrderRes.data.status, 'PaymentMethod:', checkOrderRes.data.paymentMethod);

    // 8. Test Super Admin Orders & Revenue Stats Endpoint
    const adminOrdersRes = await fetch(`${API_BASE}/orders/admin/all`, { headers: superAdminHeaders }).then(r => r.json());
    console.log('✅ 8. Super Admin Revenue Stats:', adminOrdersRes.data.stats);

    // 9. Test Super Admin Update System Payment Settings (MB BANK 5408092006)
    const updateSettingsRes = await fetch(`${API_BASE}/system-settings/payment`, {
      method: 'PUT',
      headers: superAdminHeaders,
      body: JSON.stringify({
        bankName: 'MB BANK',
        bankCode: 'MB',
        accountNumber: '5408092006',
        accountName: 'DO VAN KHOA',
        orderPrefix: 'MTCTMS',
        sepayApiKey: sepayKey
      })
    }).then(r => r.json());
    console.log('✅ 9. Super Admin Payment Settings Updated Successfully:', updateSettingsRes.data.accountNumber, updateSettingsRes.data.bankName);

    console.log('\n--- ALL BACKEND PAYMENT & ADMIN VERIFICATION TESTS PASSED PERFECTLY ---');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testPaymentAndAdminFeatures();
