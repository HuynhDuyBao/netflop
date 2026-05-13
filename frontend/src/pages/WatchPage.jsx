import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getStoredUser } from "../api.js";
import HlsPlayer from "../components/HlsPlayer.jsx";

export default function WatchPage() {
  const { movieId, episodeId } = useParams();
  const [movie, setMovie] = useState(null);
  const [quality, setQuality] = useState("auto");

  useEffect(() => {
    api.get(`/movies/${movieId}`).then((res) => setMovie(res.data));
  }, [movieId]);

  const episode = useMemo(() => {
    return movie?.episodes?.find((item) => String(item.MaTap) === String(episodeId));
  }, [movie, episodeId]);

  const source = episode?.cloudfront_url || episode?.hls_url || episode?.Link || movie?.hls_master_url;

  const handleQualityChange = useCallback((label) => {
    setQuality(label);
  }, []);

  useEffect(() => {
    if (!movie || !episode) return undefined;
    const started = Date.now();
    const user = getStoredUser();

    return () => {
      const watchSeconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      api.post("/stream/log", {
        userId: user?.id,
        username: user?.username,
        movieId: movie.MaPhim,
        episodeId: episode.MaTap,
        qualityLabel: quality,
        watchSeconds
      }).catch(() => {});
    };
  }, [movie, episode, quality]);

  if (!movie || !episode) return <section className="page"><p className="muted">Đang chuẩn bị player...</p></section>;

  return (
    <section className="watch-page">
      <HlsPlayer src={source} onQualityChange={handleQualityChange} />
      <div className="watch-info">
        <Link to={`/movies/${movie.MaPhim}`}>← Quay lại chi tiết</Link>
        <h1>{movie.TenPhim}</h1>
        <p>{episode.TenTap || `Tập ${episode.MaTap}`} · chất lượng hiện tại: {quality}</p>
      </div>
    </section>
  );
}
