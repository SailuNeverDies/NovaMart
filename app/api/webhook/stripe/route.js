import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/payment';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
    }

    let event;
    try {
      event = constructWebhookEvent(payload, signature);
    } catch (err) {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Look up if we already have an order for this payment intent
      const order = await prisma.order.findFirst({
        where: { paymentIntentId: paymentIntent.id }
      });
      
      // If we do, just ensure it's marked as PAID
      if (order && order.status === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID', paymentStatus: 'paid' }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
