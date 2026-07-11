import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { movieApi } from '../services/movieApi.js';
import { normalizeMovie, normalizeMovies } from '../utils/normalizeMovie.js';
import { useAuth } from '../hooks/useAuth.js';

const VIEW_TRACK_THROTTLE_MS = 3000;

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}

function formatWatchTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value || 0)));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = String(seconds % 60).padStart(2, '0');
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${remainingSeconds}`
    : `${minutes}:${remainingSeconds}`;
}

function formatEpisodeTitle(title, index) {
  const value = String(title || '').trim();
  if (!value || /^\d+$/.test(value)) {
    return `Tập ${index + 1}`;
  }

  return value.replace(/^tập/i, 'Tập');
}

function stars(value) {
  const score = Math.max(0, Math.min(5, Math.round(Number(value || 0) / 2)));
  return Array.from({ length: 5 }, (_, index) => (
    <span className={index < score ? 'filled' : ''} key={index}>{'\u2605'}</span>
  ));
}

function userStars(value, hoverValue, onRate, onHover, disabled) {
  const activeScore = hoverValue || value;

  return Array.from({ length: 5 }, (_, index) => {
    const score = index + 1;

    return (
      <button
        className={score <= activeScore ? 'filled' : ''}
        key={score}
        type="button"
        onClick={() => onRate(score)}
        onMouseEnter={() => onHover(score)}
        onFocus={() => onHover(score)}
        disabled={disabled}
        aria-label={`Đánh giá ${score} sao`}
      >
        {'\u2605'}
      </button>
    );
  });
}

function WatchMovie() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentMenuId, setCommentMenuId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumePoint, setResumePoint] = useState(null);
  const [resumePromptOpen, setResumePromptOpen] = useState(false);
  const [playerStartTime, setPlayerStartTime] = useState(0);
  const latestProgressRef = useRef({ currentTime: 0, duration: 0 });
  const lastSavedRef = useRef({ at: 0, seconds: -1 });

  useEffect(() => {
    async function loadWatchData() {
      setLoading(true);
      setError('');

      try {
        const [detailResponse, episodesResponse, relatedResponse, commentsResponse, historyResponse] = await Promise.all([
          movieApi.detail(id),
          movieApi.episodes(id),
          movieApi.list({ limit: 18, sort: 'popular' }),
          movieApi.comments(id, { limit: 20 }),
          user ? movieApi.history({ limit: 100 }) : Promise.resolve({ data: { data: [] } })
        ]);
        const nextMovie = normalizeMovie(detailResponse.data.data);
        const nextEpisodes = (episodesResponse.data.data || []).map((episode, index) => ({
          id: episode.MaTap,
          title: formatEpisodeTitle(episode.TenTap, index),
          sourceUrl: episode.cloudfront_url || episode.hls_url || episode.Link,
          thumbnailUrl: episode.thumbnail_url || '',
          duration: episode.duration,
          subtitles: (episode.subtitles || []).map((subtitle) => ({
            id: subtitle.MaPhuDe,
            languageCode: subtitle.MaNgonNgu,
            label: subtitle.TenNgonNgu,
            url: subtitle.LinkPhuDe,
            format: subtitle.DinhDang,
            isDefault: Boolean(subtitle.MacDinh)
          }))
        }));

        setMovie(nextMovie);
        setFavorite(Boolean(nextMovie?.isFavorite));
        setRatingValue(Math.round(Number(nextMovie?.userRating?.score || 0) / 2));
        setRatingMessage('');
        setEpisodes(nextEpisodes);
        const savedHistory = (historyResponse.data.data || []).find((item) => String(item.MaPhim) === String(id));
        const savedSeconds = Number(savedHistory?.ThoiGianXem || 0);
        const requestedEpisodeId = searchParams.get('episode') || savedHistory?.MaTap;
        const requestedEpisode = nextEpisodes.find((episode) => String(episode.id) === String(requestedEpisodeId));
        setSelectedEpisodeId(requestedEpisode?.id || nextEpisodes[0]?.id || null);
        setResumePoint(savedSeconds >= 5 ? {
          seconds: savedSeconds,
          episodeId: savedHistory?.MaTap || null
        } : null);
        setResumePromptOpen(savedSeconds >= 5);
        setPlayerStartTime(0);
        latestProgressRef.current = { currentTime: 0, duration: 0 };
        lastSavedRef.current = { at: 0, seconds: -1 };
        setRelatedMovies(normalizeMovies(relatedResponse.data.data || []).filter((item) => String(item.id) !== String(id)));
        setComments(commentsResponse.data.data || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Không tải được phim.');
      } finally {
        setLoading(false);
      }
    }

    loadWatchData();
  }, [id, user?.id]);

  const selectedEpisode = useMemo(
    () => episodes.find((episode) => episode.id === selectedEpisodeId) || episodes[0],
    [episodes, selectedEpisodeId]
  );
  const sourceUrl = selectedEpisode?.sourceUrl || movie?.hlsMasterUrl || movie?.videoUrl;
  const episodeTitle = selectedEpisode?.title || 'Full HD';
  const selectedEpisodeIndex = episodes.findIndex((episode) => episode.id === selectedEpisode?.id);
  const hasNextEpisode = selectedEpisodeIndex >= 0 && selectedEpisodeIndex < episodes.length - 1;
  const episodeItems = episodes.length ? episodes : [{ id: 'full', title: 'Full HD' }];
  const suggestionMovies = relatedMovies.slice(0, 12);
  const genreText = movie?.genres?.map((genre) => genre.name).join(', ') || 'Đang cập nhật';
  const castText = movie?.cast?.slice(0, 6).map((person) => person.name).join(', ') || 'Đang cập nhật';
  const directorText = movie?.directors?.slice(0, 3).map((person) => person.name).join(', ') || 'Đang cập nhật';
  const rootComments = useMemo(
    () => comments.filter((comment) => !comment.parent_id),
    [comments]
  );
  const repliesByParent = useMemo(() => comments.reduce((groups, comment) => {
    if (!comment.parent_id) return groups;
    const key = String(comment.parent_id);
    groups[key] = [...(groups[key] || []), comment];
    return groups;
  }, {}), [comments]);

  const persistWatchProgress = useCallback((progress, force = false) => {
    if (!user || !movie?.id) return;

    const watchedSeconds = Math.max(0, Math.floor(Number(progress?.currentTime || 0)));
    const now = Date.now();
    const hasMeaningfulChange = Math.abs(watchedSeconds - lastSavedRef.current.seconds) >= 5;
    if (!force && (!hasMeaningfulChange || now - lastSavedRef.current.at < 10000)) return;
    if (watchedSeconds < 1) return;

    lastSavedRef.current = { at: now, seconds: watchedSeconds };
    movieApi.saveHistory(movie.id, {
      episodeId: selectedEpisode?.id || null,
      watchedSeconds
    }).catch(() => {});
  }, [movie?.id, selectedEpisode?.id, user]);

  const handlePlaybackProgress = useCallback((progress) => {
    latestProgressRef.current = progress;
    persistWatchProgress(progress, progress.reason === 'pause' || progress.reason === 'ended');
  }, [persistWatchProgress]);

  useEffect(() => {
    if (!user || !movie?.id) return undefined;

    const flushProgress = () => persistWatchProgress(latestProgressRef.current, true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushProgress();
    };

    window.addEventListener('pagehide', flushProgress);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      flushProgress();
      window.removeEventListener('pagehide', flushProgress);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [movie?.id, persistWatchProgress, user]);

  useEffect(() => {
    if (!movie?.id) return;

    const storageKey = `netflop:viewed:${movie.id}`;
    const lastTrackedAt = Number(sessionStorage.getItem(storageKey) || 0);
    const now = Date.now();
    if (now - lastTrackedAt < VIEW_TRACK_THROTTLE_MS) return;
    sessionStorage.setItem(storageKey, String(now));

    movieApi.trackView(movie.id)
      .then((response) => {
        const nextViews = response.data?.data?.views;
        if (typeof nextViews === 'number') {
          setMovie((current) => current ? { ...current, views: nextViews } : current);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(storageKey);
      });
  }, [movie?.id]);

  async function submitComment(event) {
    event.preventDefault();
    if (!user) return;
    if (!commentText.trim()) {
      setCommentError('Vui lòng nhập nội dung bình luận.');
      return;
    }

    try {
      setCommentSaving(true);
      setCommentError('');
      const response = await movieApi.createComment(id, { content: commentText.trim() });
      setComments((current) => [response.data.data, ...current]);
      setCommentText('');
    } catch (submitError) {
      setCommentError(submitError.response?.data?.message || 'Không gửi được bình luận.');
    } finally {
      setCommentSaving(false);
    }
  }

  async function submitReply(event, parentComment) {
    event.preventDefault();
    if (!user || !replyText.trim()) return;

    try {
      setReplySaving(true);
      setCommentError('');
      const response = await movieApi.createComment(id, {
        content: replyText.trim(),
        parentId: parentComment.MaBinhLuan
      });
      setComments((current) => [...current, response.data.data]);
      setReplyText('');
      setReplyingTo(null);
      setCommentMenuId(null);
    } catch (submitError) {
      setCommentError(submitError.response?.data?.message || 'Không gửi được câu trả lời.');
    } finally {
      setReplySaving(false);
    }
  }

  async function deleteComment(comment) {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      setDeletingCommentId(comment.MaBinhLuan);
      setCommentError('');
      await movieApi.deleteComment(id, comment.MaBinhLuan);
      setComments((current) => current.filter((item) => (
        item.MaBinhLuan !== comment.MaBinhLuan
        && item.parent_id !== comment.MaBinhLuan
      )));
      setCommentMenuId(null);
      if (replyingTo === comment.MaBinhLuan) {
        setReplyingTo(null);
        setReplyText('');
      }
    } catch (deleteError) {
      setCommentError(deleteError.response?.data?.message || 'Không xóa được bình luận.');
    } finally {
      setDeletingCommentId(null);
    }
  }

  function canDeleteComment(comment) {
    return Boolean(user && (
      Number(comment.UserID) === Number(user.id)
      || comment.TenDN === user.ten_dang_nhap
      || ['admin', 'super_admin'].includes(user.vai_tro)
    ));
  }

  async function toggleFavorite() {
    if (!user || !movie || favoriteBusy) return;

    setFavoriteBusy(true);
    try {
      if (favorite) {
        await movieApi.removeFavorite(movie.id);
        setFavorite(false);
      } else {
        await movieApi.addFavorite(movie.id);
        setFavorite(true);
      }
    } catch (favoriteError) {
      setRatingMessage(favoriteError.response?.data?.message || 'Không cập nhật được yêu thích.');
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function submitRating(score) {
    if (!user || !movie || ratingBusy) return;

    setRatingValue(score);
    setRatingBusy(true);
    setRatingMessage('');

    try {
      await movieApi.rate(movie.id, { score: score * 2 });
      const detailResponse = await movieApi.detail(movie.id);
      const nextMovie = normalizeMovie(detailResponse.data.data);
      setMovie(nextMovie);
      setFavorite(Boolean(nextMovie?.isFavorite));
      setRatingValue(Math.round(Number(nextMovie?.userRating?.score || score * 2) / 2));
      setRatingMessage('Đã lưu đánh giá của bạn.');
    } catch (ratingError) {
      setRatingMessage(ratingError.response?.data?.message || 'Không lưu được đánh giá.');
    } finally {
      setRatingBusy(false);
    }
  }

  if (loading) {
    return <main className="watch-page"><div className="watch-loading">Đang tải phim...</div></main>;
  }

  if (error || !movie) {
    return <main className="watch-page"><p className="form-error">{error || 'Không tìm thấy phim.'}</p></main>;
  }

  return (
    <main className="watch-page">
      <section className="watch-player-stage">
        <div className="watch-breadcrumb">
          <Link to="/">‹ Trang chủ</Link>
          <span>{movie.name}</span>
          <span>{episodeTitle}</span>
        </div>
        {sourceUrl ? (
          <VideoPlayer
            key={selectedEpisode?.id || sourceUrl}
            src={sourceUrl}
            title={movie.name}
            episodeTitle={episodeTitle}
            subtitles={selectedEpisode?.subtitles || []}
            initialTime={playerStartTime}
            onProgress={handlePlaybackProgress}
            hasNextEpisode={hasNextEpisode}
            onNextEpisode={() => {
              if (hasNextEpisode) {
                const nextEpisodeId = episodes[selectedEpisodeIndex + 1].id;
                persistWatchProgress(latestProgressRef.current, true);
                setSelectedEpisodeId(nextEpisodeId);
                setPlayerStartTime(0);
                setResumePromptOpen(false);
                latestProgressRef.current = { currentTime: 0, duration: 0 };
                setSearchParams({ episode: String(nextEpisodeId) });
              }
            }}
          />
        ) : (
          <div className="video-player empty-player" style={{ backgroundImage: movie.banner ? `url(${movie.banner})` : undefined }}>
            <span>Phim này chưa có video để phát.</span>
          </div>
        )}
        {resumePromptOpen && resumePoint && (
          <div className="watch-resume-overlay" role="dialog" aria-modal="true" aria-labelledby="watch-resume-title">
            <div className="watch-resume-dialog">
              <span className="watch-resume-icon">▶</span>
              <p>Tiếp tục xem</p>
              <h2 id="watch-resume-title">{movie.name}</h2>
              <span>Bạn đã xem đến {formatWatchTime(resumePoint.seconds)}. Bạn muốn xem tiếp từ vị trí này?</span>
              <div>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    setPlayerStartTime(resumePoint.seconds);
                    setResumePromptOpen(false);
                  }}
                >
                  Tiếp tục từ {formatWatchTime(resumePoint.seconds)}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setPlayerStartTime(0);
                    setResumePromptOpen(false);
                    movieApi.saveHistory(movie.id, {
                      episodeId: selectedEpisode?.id || null,
                      watchedSeconds: 0
                    }).catch(() => {});
                  }}
                >
                  Xem lại từ đầu
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="watch-detail-panel">
        <div className="watch-detail-main">
          <p className="watch-title-small">{movie.name}</p>
          <h1>{movie.title || movie.name}</h1>
          <div className="watch-score-row">
            <strong>{formatNumber(movie.views)} lượt xem</strong>
            <span>{Number(movie.rating || 0).toFixed(1)}</span>
            <span className="watch-stars">{stars(movie.rating)}</span>
          </div>
          <div className="watch-meta-line">
            <span>{movie.year || 'N/A'}</span>
            <span>{movie.status || 'Đang chiếu'}</span>
            <span>{movie.country || 'Đang cập nhật'}</span>
            <span>{movie.type || 'Phim'}</span>
            <span>{movie.quality || 'Full HD'}</span>
          </div>
          <h2>{episodeTitle}</h2>
          <p className="watch-description">{movie.description || 'Nội dung phim đang được cập nhật.'}</p>

          <section className="watch-episode-panel" aria-labelledby="watch-episodes-title">
            <div className="watch-episodes-heading">
              <div>
                <span className="watch-section-kicker">Tập phim</span>
                <h2 id="watch-episodes-title">Danh sách tập</h2>
              </div>
              <span className="watch-episode-count">
                {episodes.length ? `${Math.max(selectedEpisodeIndex + 1, 1)}/${episodes.length}` : '1/1'} tập
              </span>
            </div>
            <div className="watch-episode-row">
              {episodeItems.map((episode, index) => {
                const isActive = episode.id === selectedEpisode?.id || (!selectedEpisode && index === 0);
                const episodeImage = episode.thumbnailUrl || movie.banner || movie.poster || '';

                return (
                  <button
                    className={isActive ? 'watch-episode-card active' : 'watch-episode-card'}
                    key={episode.id}
                    type="button"
                    aria-label={`Xem ${episode.title}`}
                    onClick={() => {
                      persistWatchProgress(latestProgressRef.current, true);
                      setSelectedEpisodeId(episode.id);
                      setPlayerStartTime(0);
                      setResumePromptOpen(false);
                      latestProgressRef.current = { currentTime: 0, duration: 0 };
                      setSearchParams({ episode: String(episode.id) });
                    }}
                  >
                    <span className="watch-episode-thumb">
                      {episodeImage && <img src={episodeImage} alt="" loading="lazy" />}
                      <small>Tập {index + 1}</small>
                      <i aria-hidden="true">▶</i>
                    </span>
                    <em>{episode.duration ? `${episode.duration} giây` : isActive ? 'Đang xem' : 'Sẵn sàng phát'}</em>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="watch-side-info">
          <div className="watch-actions">
            <button className={favorite ? 'active' : ''} type="button" onClick={toggleFavorite} disabled={!user || favoriteBusy}>
              <span>{favorite ? '\u2665' : '\u2661'}</span>
              <strong>{favoriteBusy ? 'Đang lưu' : favorite ? 'Đã thích' : 'Yêu thích'}</strong>
            </button>
            <a href="#comments"><span>▤</span><strong>Bình luận</strong></a>
          </div>
          <div className="watch-user-rating">
            <strong>Đánh giá của bạn</strong>
            {user ? (
              <>
                <div className="watch-user-stars" onMouseLeave={() => setRatingHover(0)}>
                  {userStars(ratingValue, ratingHover, submitRating, setRatingHover, ratingBusy)}
                </div>
                <span>{ratingBusy ? 'Đang lưu...' : ratingValue ? `${ratingValue}/5 sao` : 'Chọn từ 1 đến 5 sao'}</span>
                {ratingMessage && <small>{ratingMessage}</small>}
              </>
            ) : (
              <>
                <div className="watch-user-stars readonly">
                  {userStars(0, 0, () => {}, () => {}, true)}
                </div>
                <Link to="/login">Đăng nhập để đánh giá</Link>
              </>
            )}
          </div>
          <dl>
            <dt>Diễn viên:</dt>
            <dd>{castText}</dd>
            <dt>Đạo diễn:</dt>
            <dd>{directorText}</dd>
            <dt>Thể loại:</dt>
            <dd>{genreText}</dd>
          </dl>
        </aside>
      </section>

      <section className="watch-netflop-section">
        {suggestionMovies.length > 0 && (
          <section className="watch-suggestion-section" aria-labelledby="watch-suggestion-title">
            <div className="watch-section-heading">
              <div>
                <span className="watch-section-kicker">Gợi ý</span>
                <h2 id="watch-suggestion-title">Gợi ý cho bạn</h2>
              </div>
              <Link to="/movies?sort=popular">Xem thêm</Link>
            </div>
            <div className="watch-suggestion-row">
              {suggestionMovies.map((item) => (
                <Link className="watch-suggestion-card" key={item.id} to={`/movies/${item.id}`}>
                  <span className="watch-suggestion-poster">
                    {item.banner || item.poster ? <img src={item.banner || item.poster} alt={item.name} /> : <i>{item.name?.slice(0, 1)}</i>}
                    <small>{item.quality || 'HD'}</small>
                    <b aria-hidden="true">▶</b>
                  </span>
                  <strong>{item.name}</strong>
                  <em>{item.year || 'N/A'} · {Number(item.rating || 0).toFixed(1)} · {item.type || 'Phim'}</em>
                </Link>
              ))}
            </div>
          </section>
        )}

        {movie.cast.length > 0 && (
          <section className="watch-cast-section" aria-labelledby="watch-cast-title">
            <div className="watch-section-heading">
              <h2 id="watch-cast-title">Diễn viên</h2>
            </div>
            <div className="watch-cast-row">
              {movie.cast.slice(0, 12).map((person, index) => (
                <Link className="watch-cast-card" to={`/people/${person.id}`} key={`${person.id || person.name}-${index}`}>
                  <span>
                    {person.profile ? <img src={person.profile} alt={person.name} /> : person.name?.slice(0, 1)}
                  </span>
                  <strong>{person.name}</strong>
                  {person.character && <small>{person.character}</small>}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="watch-comments" id="comments">
          <div className="watch-section-heading">
            <h2>Bình luận</h2>
            <span>{comments.length} bình luận</span>
          </div>

          {user ? (
            <form className="watch-comment-form" onSubmit={submitComment}>
              <div className="watch-comment-avatar">{(user.ten_dang_nhap || 'U').slice(0, 1).toUpperCase()}</div>
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Viết bình luận của bạn..."
                rows="3"
              />
              <button type="submit" disabled={commentSaving}>{commentSaving ? 'Đang gửi...' : 'Gửi bình luận'}</button>
              {commentError && <p className="form-error">{commentError}</p>}
            </form>
          ) : (
            <div className="watch-login-required">
              <strong>Đăng nhập để tham gia bình luận</strong>
              <p>Bạn cần đăng nhập tài khoản Netflop trước khi gửi bình luận cho phim này.</p>
              <Link className="button primary" to="/login">Đăng nhập</Link>
            </div>
          )}

          <div className="watch-comment-list">
            {rootComments.map((comment) => {
              const replies = repliesByParent[String(comment.MaBinhLuan)] || [];
              return (
                <article className="watch-comment-thread" key={comment.MaBinhLuan}>
                  <div className="watch-comment-item">
                    <div className="watch-comment-avatar">
                      {comment.hinh_dai_dien ? <img src={comment.hinh_dai_dien} alt="" /> : (comment.TenDN || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="watch-comment-body">
                      <header>
                        <strong>{comment.TenDN || 'Người dùng'}</strong>
                        <span>{formatDate(comment.ThoiGian)}</span>
                        {user && (
                          <div className="watch-comment-menu">
                            <button type="button" onClick={() => setCommentMenuId((current) => current === comment.MaBinhLuan ? null : comment.MaBinhLuan)} aria-label="Mở tùy chọn bình luận">•••</button>
                            {commentMenuId === comment.MaBinhLuan && (
                              <div>
                                <button type="button" onClick={() => {
                                  setReplyingTo(comment.MaBinhLuan);
                                  setReplyText('');
                                  setCommentMenuId(null);
                                }}>Trả lời</button>
                                {canDeleteComment(comment) && <button className="danger" type="button" disabled={deletingCommentId === comment.MaBinhLuan} onClick={() => deleteComment(comment)}>Xóa bình luận</button>}
                              </div>
                            )}
                          </div>
                        )}
                      </header>
                      <p>{comment.NoiDung}</p>
                    </div>
                  </div>

                  {replies.length > 0 && (
                    <div className="watch-comment-replies">
                      {replies.map((reply) => (
                        <div className="watch-comment-item is-reply" key={reply.MaBinhLuan}>
                          <div className="watch-comment-avatar">
                            {reply.hinh_dai_dien ? <img src={reply.hinh_dai_dien} alt="" /> : (reply.TenDN || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="watch-comment-body">
                            <header>
                              <strong>{reply.TenDN || 'Người dùng'}</strong>
                              <span>{formatDate(reply.ThoiGian)}</span>
                              {canDeleteComment(reply) && (
                                <button className="watch-comment-delete" type="button" disabled={deletingCommentId === reply.MaBinhLuan} onClick={() => deleteComment(reply)} aria-label="Xóa câu trả lời">Xóa</button>
                              )}
                            </header>
                            <p>{reply.NoiDung}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === comment.MaBinhLuan && (
                    <form className="watch-reply-form" onSubmit={(event) => submitReply(event, comment)}>
                      <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder={`Trả lời ${comment.TenDN || 'người dùng'}...`} autoFocus />
                      <button type="button" onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}>Hủy</button>
                      <button type="submit" disabled={replySaving || !replyText.trim()}>{replySaving ? 'Đang gửi...' : 'Gửi'}</button>
                    </form>
                  )}
                </article>
              );
            })}
            {comments.length === 0 && <p className="watch-empty-comments">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

export default WatchMovie;
