import { movieApi } from '../services/movieApi.js';
import { normalizeMovies } from './normalizeMovie.js';

function mergeUniqueMovies(groups, currentMovieId, limit) {
  const seen = new Set([String(currentMovieId)]);
  const merged = [];

  groups.flat().forEach((movie) => {
    const movieId = String(movie?.id || '');
    if (!movieId || seen.has(movieId)) return;
    seen.add(movieId);
    merged.push(movie);
  });

  return merged.slice(0, limit);
}

export async function loadGenreRecommendations(movie, currentMovieId, { limit = 12, sort = 'popular' } = {}) {
  try {
    const response = await movieApi.recommendations(currentMovieId, { limit });
    const recommendations = mergeUniqueMovies(
      [normalizeMovies(response.data.data || [])],
      currentMovieId,
      limit
    );

    if (recommendations.length > 0) {
      return recommendations;
    }
  } catch {
    // Fall back to client-side genre filtering when the dedicated endpoint is unavailable.
  }

  const genreIds = (movie?.genres || [])
    .map((genre) => Number(genre.id))
    .filter(Boolean)
    .slice(0, 3);

  const genreRequests = genreIds.map((genreId) => movieApi.list({ genreId, limit, sort }));
  const genreResults = await Promise.allSettled(genreRequests);
  const genreMovies = genreResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => normalizeMovies(result.value.data.data || []));

  let recommendations = mergeUniqueMovies(genreMovies, currentMovieId, limit);

  if (recommendations.length < limit) {
    try {
      const fallbackResponse = await movieApi.list({ limit, sort });
      recommendations = mergeUniqueMovies(
        [recommendations, normalizeMovies(fallbackResponse.data.data || [])],
        currentMovieId,
        limit
      );
    } catch {
      return recommendations;
    }
  }

  return recommendations;
}
