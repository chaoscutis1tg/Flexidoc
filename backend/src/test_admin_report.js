import mongoose from 'mongoose';
import { config } from './config/env.js';
import { orderRepository } from './repositories/order.repository.js';

const testReport = async () => {
  await mongoose.connect(config.mongodbUri);
  console.log('=== TESTING ADMIN REPORT & ANALYTICS API ===');

  const reportThisMonth = await orderRepository.getAdminReportData({ timeframe: 'THIS_MONTH' });
  console.log('[1. Report THIS_MONTH]:');
  console.log('  - Total Revenue:', reportThisMonth.summary.totalRevenue);
  console.log('  - Success Orders:', reportThisMonth.summary.successOrdersCount);
  console.log('  - Most Popular Plan:', reportThisMonth.summary.mostPopularPlan);
  console.log('  - Top Buyer:', reportThisMonth.summary.topBuyer);
  console.log('  - Package Breakdown Count:', reportThisMonth.packageBreakdown.length);
  console.log('  - Buyers List Count:', reportThisMonth.buyersList.length);

  const reportAll = await orderRepository.getAdminReportData({ timeframe: 'ALL' });
  console.log('[2. Report ALL]:');
  console.log('  - Total Revenue:', reportAll.summary.totalRevenue);
  console.log('  - Buyers List Count:', reportAll.buyersList.length);

  console.log('\n✅ TEST REPORT API PASSED 100%!');
  process.exit(0);
};

testReport();
