function youtubeKeyFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '') || null;
    }

    return parsedUrl.searchParams.get('v') || parsedUrl.pathname.split('/').filter(Boolean).pop() || null;
  } catch {
    return null;
  }
}

export function normalizeMovie(movie) {
  if (!movie) {
    return null;
  }

  const trailerKey = movie.TrailerYoutubeKey || youtubeKeyFromUrl(movie.Link);

  return {
    id: movie.MaPhim,
    name: movie.TenPhim,
    title: movie.TieuDe,
    description: movie.MoTa || movie.NoiDung || '',
    content: movie.NoiDung || '',
    year: movie.NamPhatHanh,
    duration: movie.ThoiLuong,
    rating: movie.DanhGia,
    views: movie.LuotXem,
    status: movie.TinhTrang,
    type: movie.PhanLoai,
    poster: movie.HinhAnh,
    banner: movie.HinhAnhBanner || movie.HinhAnh,
    trailer: movie.Link,
    trailerKey,
    trailerEmbedUrl: trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : null,
    videoUrl: movie.VideoUrl,
    hlsMasterUrl: movie.hls_master_url,
    cloudfrontBaseUrl: movie.cloudfront_base_url,
    country: movie.TenQuocGia,
    isFavorite: movie.isFavorite,
    userRating: movie.userRating || null,
    historyEpisodeId: movie.MaTap ?? null,
    watchedSeconds: Number(movie.ThoiGianXem || 0),
    watchedAt: movie.ThoiGian || null,
    MaTap: movie.MaTap ?? null,
    ThoiGianXem: Number(movie.ThoiGianXem || 0),
    ThoiGian: movie.ThoiGian || null,
    genres: (movie.the_loai || []).map((genre) => ({
      id: genre.MaTheLoai,
      name: genre.TenTheLoai
    })),
    episodes: (movie.tap_phim || []).map((episode) => ({
      id: episode.MaTap,
      movieId: episode.MaPhim,
      title: episode.TenTap,
      sourceUrl: episode.cloudfront_url || episode.hls_url || episode.Link,
      duration: episode.duration,
      status: episode.upload_status
    })),
    cast: (movie.dien_vien || []).map((person) => ({
      id: person.MaDienVien,
      tmdbId: person.tmdb_id,
      name: person.TenDienVien,
      character: person.TenNhanVat,
      profile: person.HinhAnh
    })),
    directors: (movie.dao_dien || []).map((person) => ({
      id: person.MaDaoDien,
      tmdbId: person.tmdb_id,
      name: person.TenDaoDien,
      job: person.VaiTro,
      profile: person.HinhAnh
    })),
    quality: movie.hls_master_url ? 'HLS' : 'HD'
  };
}

export function normalizeMovies(movies = []) {
  return movies.map(normalizeMovie).filter(Boolean);
}
