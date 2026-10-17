import { describe, it, expect } from 'vitest';
import { getPaymentDescription, type ExportPayment } from '@/lib/reports/excelGenerator';

describe('TDD: getPaymentDescription Months Suffix Display (csa-reports-months-display)', () => {
  const sampleConfig = {
    serviceTemplate: '{customerId} - {customerName} - {serviceName}',
    orderTemplate: 'ORDER {orderNumber} - {orderContent}',
  };

  it('should append (x3 tháng) to serviceName when order.months is 3', () => {
    const payment: ExportPayment = {
      paidAt: Date.now(),
      amount: 1500000,
      type: 'in',
      content: 'Chuyen tien hosting 3 thang',
      customer: {
        id: 'AG1002',
        fullName: 'Nguyen Van A',
      },
      order: {
        id: 'ord-1',
        orderNumber: 'ORD-001',
        content: 'Thanh toan dich vu Hosting Pro',
        months: 3,
      },
      serviceName: 'Hosting Pro',
    };

    const description = getPaymentDescription(payment, sampleConfig);
    expect(description).toBe('AG1002 - Nguyen Van A - Hosting Pro (x3 tháng)');
  });

  it('should NOT append months suffix when order.months is 1', () => {
    const payment: ExportPayment = {
      paidAt: Date.now(),
      amount: 500000,
      type: 'in',
      content: 'Chuyen tien hosting 1 thang',
      customer: {
        id: 'AG1002',
        fullName: 'Nguyen Van A',
      },
      order: {
        id: 'ord-2',
        orderNumber: 'ORD-002',
        content: 'Thanh toan dich vu Hosting Pro',
        months: 1,
      },
      serviceName: 'Hosting Pro',
    };

    const description = getPaymentDescription(payment, sampleConfig);
    expect(description).toBe('AG1002 - Nguyen Van A - Hosting Pro');
  });

  it('should NOT append months suffix when order.months is undefined', () => {
    const payment: ExportPayment = {
      paidAt: Date.now(),
      amount: 500000,
      type: 'in',
      content: 'Chuyen tien hosting legacy',
      customer: {
        id: 'AG1002',
        fullName: 'Nguyen Van A',
      },
      order: {
        id: 'ord-3',
        orderNumber: 'ORD-003',
        content: 'Thanh toan dich vu Hosting Pro',
      },
      serviceName: 'Hosting Pro',
    };

    const description = getPaymentDescription(payment, sampleConfig);
    expect(description).toBe('AG1002 - Nguyen Van A - Hosting Pro');
  });

  it('should fallback to order.content and append suffix when serviceName is null but order.months > 1', () => {
    const payment: ExportPayment = {
      paidAt: Date.now(),
      amount: 1500000,
      type: 'in',
      content: 'Chuyen tien custom',
      customer: {
        id: 'AG1002',
        fullName: 'Nguyen Van A',
      },
      order: {
        id: 'ord-4',
        orderNumber: 'ORD-004',
        content: 'Dich vu tuy bien',
        months: 6,
      },
      serviceName: null,
    };

    const description = getPaymentDescription(payment, sampleConfig);
    expect(description).toBe('AG1002 - Nguyen Van A - Dich vu tuy bien (x6 tháng)');
  });
});
