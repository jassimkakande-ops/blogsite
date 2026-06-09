import { NextRequest, NextResponse } from 'next/server';
import { MakyPayService, MakyPayWebhook } from '@/lib/makypay';

export async function POST(request: NextRequest) {
  try {
    const payload: MakyPayWebhook = await request.json();
    
    await MakyPayService.handleWebhook(payload);
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
