import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import path from 'path';
import { createOrderFromPayment } from '@/lib/services/serviceManager';

describe('TDD: createOrderFromPayment Revenue Tagging & Content Months', () => {
  let db: any;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    db = getDb();
    migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });

    // Clean tables in reverse dependency order
    await db.update(schema.payments).set({ orderId: null });
    await db.delete(schema.customerServices);
    await db.delete(schema.orders);
    await db.delete(schema.payments);
    await db.delete(schema.services);
    await db.delete(schema.customers);

    // Seed customer
    await db.insert(schema.customers).values({
      id: 'cust-1',
      fullName: 'Nguyen Van A',
      phone: '0901234567',
      status: 'active',
      createdAt: Date.now(),
    });

    // Seed service
    await db.insert(schema.services).values({
      id: 'srv-web',
      name: 'Hosting Pro',
      price: 500000,
      billingCycle: 30,
      prefix: 'HOSTING',
      status: 'active',
      createdAt: Date.now(),
    });

    // Seed initial payment as non_revenue without orderId
    await db.insert(schema.payments).values({
      id: 'pay-1',
      amount: 500000,
      category: 'non_revenue',
      taxCategory: null,
      content: 'Chuyen tien Hosting Pro',
      status: 'success',
      paidAt: Date.now(),
      createdAt: Date.now(),
    });
  });

  it('should update payments.category to revenue and set taxCategory on order creation', async () => {
    const result = await createOrderFromPayment(db, {
      paymentId: 'pay-1',
      customerId: 'cust-1',
      serviceId: 'srv-web',
      startDate: Date.now(),
      expiredAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      category: 'revenue',
      taxCategory: 'Hosting Pro',
    });

    expect(result.success).toBe(true);

    const [updatedPayment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, 'pay-1'));

    expect(updatedPayment.orderId).toBe(result.orderId);
    expect(updatedPayment.category).toBe('revenue');
    expect(updatedPayment.taxCategory).toBe('Hosting Pro');
  });

  it('should format orders.content with (N thang) when months > 1', async () => {
    const result = await createOrderFromPayment(db, {
      paymentId: 'pay-1',
      customerId: 'cust-1',
      serviceId: 'srv-web',
      startDate: Date.now(),
      expiredAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      months: 3,
      category: 'revenue',
    });

    expect(result.success).toBe(true);

    const [createdOrder] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, result.orderId));

    expect(createdOrder.content).toBe('Thanh toan dich vu Hosting Pro (3 thang)');
    expect(createdOrder.months).toBe(3);
  });

  it('should format orders.content without months suffix when months is 1', async () => {
    const result = await createOrderFromPayment(db, {
      paymentId: 'pay-1',
      customerId: 'cust-1',
      serviceId: 'srv-web',
      startDate: Date.now(),
      expiredAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      months: 1,
      category: 'revenue',
    });

    expect(result.success).toBe(true);

    const [createdOrder] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, result.orderId));

    expect(createdOrder.content).toBe('Thanh toan dich vu Hosting Pro');
    expect(createdOrder.months).toBe(1);
  });
});
