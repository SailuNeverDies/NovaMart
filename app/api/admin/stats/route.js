import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/stats — dashboard statistics
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      totalUsers,
      totalProducts,
      paidOrders,
      recentOrders,
      lowStockProducts,
      dailyRevenue,
      currentMonthOrders,
      previousMonthOrders,
      currentMonthUsers,
      previousMonthUsers,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count(),
      prisma.order.aggregate({
        where: { status: { notIn: ['PENDING', 'CANCELLED', 'REFUNDED'] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        take: 5,
        orderBy: { stock: 'asc' },
        include: { images: { take: 1 } },
      }),
      // Revenue by day for the last 7 days
      prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { notIn: ['PENDING', 'CANCELLED', 'REFUNDED'] },
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Current vs Previous 30 days for Revenue and Orders
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { notIn: ['PENDING', 'CANCELLED', 'REFUNDED'] },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: { notIn: ['PENDING', 'CANCELLED', 'REFUNDED'] },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Current vs Previous 30 days for Users
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    // Build daily revenue chart data
    const dayLabels = [];
    const dayRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dayLabels.push(label);
      const dayTotal = dailyRevenue
        .filter((o) => {
          const od = new Date(o.createdAt);
          return od.toDateString() === d.toDateString();
        })
        .reduce((sum, o) => sum + o.total, 0);
      dayRevenue.push(parseFloat(dayTotal.toFixed(2)));
    }

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%';
      const pct = ((curr - prev) / prev) * 100;
      return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
    };

    return NextResponse.json({
      stats: {
        totalOrders,
        totalUsers,
        totalProducts,
        totalRevenue: paidOrders._sum.total || 0,
        paidOrderCount: paidOrders._count || 0,
        revenueChange: calcChange(currentMonthOrders._sum.total || 0, previousMonthOrders._sum.total || 0),
        ordersChange: calcChange(currentMonthOrders._count || 0, previousMonthOrders._count || 0),
        usersChange: calcChange(currentMonthUsers, previousMonthUsers),
      },
      recentOrders,
      lowStockProducts,
      chart: { labels: dayLabels, revenue: dayRevenue },
    });
  } catch (error) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
