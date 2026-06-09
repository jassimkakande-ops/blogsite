import { NextRequest, NextResponse } from 'next/server';
import { YoPaymentsService } from '@/lib/yopayments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionReference } = body;

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Missing transactionReference' },
        { status: 400 }
      );
    }

    // Check transaction status
    const result = await YoPaymentsService.waitForTransactionCompletion({
      transactionReference,
    });

    return NextResponse.json({
      success: true,
      transaction: result,
    });

  } catch (error) {
    console.error('YoPayments status check error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Status check failed',
        success: false
      },
      { status: 500 }
    );
  }
}