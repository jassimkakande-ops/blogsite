import { NextRequest, NextResponse } from 'next/server';
import { MakyPayService } from '@/lib/makypay';

export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    const status = await MakyPayService.checkTransactionStatus(transactionId);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
