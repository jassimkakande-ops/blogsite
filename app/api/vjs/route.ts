import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: vjs, error } = await supabase
      .from('vjs')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching VJs:', error);
      return NextResponse.json({ vjs: [] }, { status: 500 });
    }

    return NextResponse.json({ vjs: vjs || [] });
  } catch (error) {
    console.error('VJs API error:', error);
    return NextResponse.json({ vjs: [] }, { status: 500 });
  }
}