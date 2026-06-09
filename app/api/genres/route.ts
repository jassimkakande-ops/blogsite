import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: genres, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching genres:', error);
      return NextResponse.json({ genres: [] }, { status: 500 });
    }

    return NextResponse.json({ genres: genres || [] });
  } catch (error) {
    console.error('Genres API error:', error);
    return NextResponse.json({ genres: [] }, { status: 500 });
  }
}