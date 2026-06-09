const https = require('https');
const tmdb = require('../config/tmdb');
const HttpError = require('../utils/httpError');

function assertTmdbConfig() {
  if (!tmdb.accessToken && !tmdb.apiKey) {
    throw new HttpError(500, 'TMDB_API_KEY hoac TMDB_ACCESS_TOKEN chua duoc cau hinh.');
  }
}

function imageUrl(path, size = 'w500') {
  return path ? `${tmdb.imageBaseUrl}/${size}${path}` : null;
}

async function requestTmdb(path, params = {}) {
  assertTmdbConfig();

  const url = new URL(`${tmdb.baseUrl}${path}`);
  url.searchParams.set('language', params.language || 'vi-VN');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const headers = {};

  if (tmdb.accessToken) {
    headers.Authorization = `Bearer ${tmdb.accessToken}`;
  } else {
    url.searchParams.set('api_key', tmdb.apiKey);
  }

  const response = await fetchTmdb(url, headers);

  if (!response.ok) {
    const body = await response.text();
    throw new HttpError(response.status, `TMDB request failed: ${body}`);
  }

  return response.json();
}

async function fetchTmdb(url, headers) {
  try {
    return await fetch(url, { headers });
  } catch (error) {
    if (error.cause?.code !== 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      throw error;
    }

    return fetchTmdbWithLocalCertificateFallback(url, headers);
  }
}

function fetchTmdbWithLocalCertificateFallback(url, headers) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers, rejectUnauthorized: false }, (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          text: async () => body,
          json: async () => JSON.parse(body)
        });
      });
    });

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error('TMDB request timeout'));
    });
  });
}

function mapSearchItem(item) {
  return {
    tmdbId: item.id,
    title: item.title || item.name,
    originalTitle: item.original_title || item.original_name,
    overview: item.overview,
    poster: imageUrl(item.poster_path),
    banner: imageUrl(item.backdrop_path, 'w1280'),
    releaseDate: item.release_date || item.first_air_date,
    year: Number((item.release_date || item.first_air_date || '').slice(0, 4)) || null,
    rating: item.vote_average || 0,
    mediaType: item.media_type || 'movie'
  };
}

function selectBestTrailer(videos = []) {
  return videos.find((video) => (
    video.site === 'YouTube' &&
    video.type === 'Trailer' &&
    video.official === true
  )) ||
    videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ||
    videos.find((video) => video.site === 'YouTube') ||
    null;
}

function mapTrailer(video) {
  if (!video?.key) {
    return null;
  }

  return {
    name: video.name,
    key: video.key,
    url: `https://www.youtube.com/watch?v=${video.key}`,
    embedUrl: `https://www.youtube.com/embed/${video.key}`
  };
}

function mapMovieDetail(detail) {
  const credits = detail.credits || {};
  const videos = detail.videos?.results || [];
  const trailer = mapTrailer(selectBestTrailer(videos));

  return {
    tmdbId: detail.id,
    mediaType: detail.number_of_seasons ? 'tv' : 'movie',
    name: detail.title || detail.name,
    title: detail.original_title || detail.original_name || detail.title || detail.name,
    description: detail.overview || '',
    content: detail.overview || '',
    duration: detail.runtime || (detail.episode_run_time || [])[0] || null,
    year: Number((detail.release_date || detail.first_air_date || '').slice(0, 4)) || null,
    rating: detail.vote_average || 0,
    views: 0,
    status: detail.status === 'Released' || detail.status === 'Ended' ? 'Đã kết thúc' : 'Đang chiếu',
    type: detail.number_of_seasons ? 'Bộ' : 'Lẻ',
    poster: imageUrl(detail.poster_path),
    banner: imageUrl(detail.backdrop_path, 'w1280'),
    link: trailer?.url || null,
    trailerKey: trailer?.key || null,
    trailerEmbedUrl: trailer?.embedUrl || null,
    country: (detail.production_countries || [])[0]?.name || null,
    genres: (detail.genres || []).map((genre) => ({
      tmdbId: genre.id,
      name: genre.name
    })),
    cast: (credits.cast || []).slice(0, 12).map((person) => ({
      tmdbId: person.id,
      name: person.name,
      character: person.character || '',
      profile: imageUrl(person.profile_path, 'w185')
    })),
    directors: (credits.crew || [])
      .filter((person) => person.job === 'Director' || person.job === 'Creator' || person.department === 'Directing')
      .slice(0, 8)
      .map((person) => ({
        tmdbId: person.id,
        name: person.name,
        job: person.job || person.department || 'Director',
        profile: imageUrl(person.profile_path, 'w185')
      })),
    videos: videos.slice(0, 5).map((video) => ({
      key: video.key,
      name: video.name,
      site: video.site,
      type: video.type,
      url: video.site === 'YouTube' ? `https://www.youtube.com/watch?v=${video.key}` : null
    })),
    isPublished: false,
    hlsMasterUrl: null
  };
}

async function search({ query, page = 1, type = 'movie' }) {
  if (!query) {
    return { data: [], meta: { page: 1, totalPages: 0, total: 0 } };
  }

  const endpoint = type === 'multi' ? '/search/multi' : `/search/${type}`;
  const result = await requestTmdb(endpoint, { query, page });

  return {
    data: (result.results || []).map(mapSearchItem),
    meta: {
      page: result.page,
      totalPages: result.total_pages,
      total: result.total_results
    }
  };
}

async function getDetail(tmdbId, type = 'movie') {
  const detail = await requestTmdb(`/${type}/${tmdbId}`, {
    append_to_response: 'credits,videos'
  });

  return mapMovieDetail(detail);
}

async function getMovieVideos(tmdbId, type = 'movie') {
  const result = await requestTmdb(`/${type}/${tmdbId}/videos`, {
    language: 'en-US'
  });

  return result.results || [];
}

async function getBestTrailer(tmdbId, type = 'movie') {
  const videos = await getMovieVideos(tmdbId, type);
  return mapTrailer(selectBestTrailer(videos));
}

module.exports = {
  getDetail,
  getBestTrailer,
  getMovieVideos,
  search
};
