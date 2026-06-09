import { NextResponse } from 'next/server'
import ReelplexiService from '@/lib/reelplexi-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    
    console.log('Fetching genres from Reelplexi...')
    const genres = await ReelplexiService.getGenres()
    console.log('Genres fetched:', genres.length, 'genres:', genres.map(g => g.name).join(', '))
    
    if (genres.length === 0) {
      console.warn('No genres returned from Reelpexi')
      return NextResponse.json({
        success: true,
        data: []
      })
    }
    
    // Take first 3 genres for home page to avoid timeout
    const topGenres = genres.slice(0, 3)
    console.log('Processing genres:', topGenres.map(g => g.name).join(', '))
    
    const genreRows = await Promise.all(
      topGenres.map(async (genre) => {
        try {
          console.log(`Fetching content for genre: ${genre.name} (id: ${genre.id})`)
          // Only fetch movies to speed up the request
          const movies = await ReelplexiService.getMoviesByGenre(genre.id)
          console.log(`Genre ${genre.name} returned ${movies.length} movies`)
          
          const items = movies.slice(0, limit).map(item => ({
            ...item,
            type: 'movie' as const,
            created_at: item.release_date || new Date().toISOString(),
          }))
          
          console.log(`Genre ${genre.name} has ${items.length} items after processing`)
          
          return {
            name: genre.name,
            movies: items,
          }
        } catch (error) {
          console.error(`Error fetching genre ${genre.name}:`, error)
          return {
            name: genre.name,
            movies: [],
          }
        }
      })
    )
    
    // Filter out empty genre rows
    const validGenreRows = genreRows.filter(row => row.movies.length > 0)
    console.log('Valid genre rows:', validGenreRows.length, 'rows with data')
    
    return NextResponse.json({
      success: true,
      data: validGenreRows
    })
  } catch (error) {
    console.error('Error fetching genre rows:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch genre rows', data: [] },
      { status: 500 }
    )
  }
}
