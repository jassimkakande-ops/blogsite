import { NextRequest, NextResponse } from 'next/server';
import { MakyPayService } from '@/lib/makypay';

export async function POST(request: NextRequest) {
  try {
    const { userId, transactionId, subscriptionPlan, subscriptionDuration = 30 } = await request.json();

    if (!userId || !transactionId || !subscriptionPlan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await MakyPayService.completeSubscriptionPayment({
      userId,
      transactionId,
      subscriptionPlan,
      subscriptionDuration,
    });

    return NextResponse.json({ status: 'success', message: 'Subscription activated' });
  } catch (error: any) {
    console.error('Subscription completion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete subscription' },
      { status: 500 }
    );
  }
}
