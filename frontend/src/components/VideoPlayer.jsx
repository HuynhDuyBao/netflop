import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const HLS_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

let hlsScriptPromise = null;

function PlayerIcon({ name }) {
  const paths = {
    play: <path d="M8 5v14l11-7z" />,
    pause: <path d="M7 5h4v14H7zm6 0h4v14h-4z" />,
    volume: <path d="M4 9v6h4l5 4V5L8 9H4zm11.5-.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12" />,
    muted: <path d="M4 9v6h4l5 4V5L8 9H4zm12-1 6 8m0-8-6 8" />,
    fullscreen: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
    exitFullscreen: <path d="M9 4v5H4M15 4v5h5M15 20v-5h5M9 20v-5H4" />,
    pip: <path d="M3 5h18v14H3zM13 12h6v5h-6z" />,
    next: <path d="M6 5v14l9-7zm11 0h2v14h-2z" />,
    captions: <path d="M3 6h18v12H3zM10 10a3 3 0 1 0 0 4m8-4a3 3 0 1 0 0 4" />,
    settings: <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0-5v2m0 13v2m8.5-8.5h-2m-13 0h-2m15.1-6.1-1.4 1.4M6.8 17.2l-1.4 1.4m13.2 0-1.4-1.4M6.8 6.8 5.4 5.4" />
  };

  return (
    <svg className={`player-icon player-icon-${name}`} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function SeekIcon({ direction }) {
  return (
    <span className={`seek-icon seek-icon-${direction}`} aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path d={direction === 'back' ? 'M9 8H4v-5M5 8a12 12 0 1 1-1 11' : 'M23 8h5v-5m-1 5a12 12 0 1 0 1 11'} />
      </svg>
      <strong>10</strong>
    </span>
  );
}

function getApiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  try {
    return new URL(apiUrl).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveMediaUrl(src) {
  if (!src) return '';
  const value = String(src).trim();
  if (!value) return '';

  if (/^(blob:|data:|https?:\/\/|\/\/)/i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${getApiOrigin()}${value}`;
  }

  return value;
}

function proxiedMediaUrl(src) {
  return `${getApiOrigin()}/api/media-proxy?url=${encodeURIComponent(src)}`;
}

function subtitleMediaUrl(src) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return '';

  try {
    const parsed = new URL(resolved);
    if (parsed.origin === window.location.origin || parsed.origin === getApiOrigin()) {
      return resolved;
    }
  } catch {
    return resolved;
  }

  return proxiedMediaUrl(resolved);
}

function youtubeKeyFromUrl(src) {
  try {
    const parsedUrl = new URL(src);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (host.endsWith('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/').filter(Boolean)[1] || '';
      }

      return parsedUrl.searchParams.get('v') || '';
    }
  } catch {
    return '';
  }

  return '';
}

function getEmbedUrl(src) {
  const youtubeKey = youtubeKeyFromUrl(src);
  if (youtubeKey) {
    const params = new URLSearchParams({
      autoplay: '0',
      rel: '0',
      modestbranding: '1',
      origin: window.location.origin
    });

    return `https://www.youtube.com/embed/${youtubeKey}?${params.toString()}`;
  }

  try {
    const parsedUrl = new URL(src);
    if (parsedUrl.hostname.includes('vimeo.com')) {
      const id = parsedUrl.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch {
    return '';
  }

  return '';
}

function isHlsSource(src) {
  try {
    return new URL(src, window.location.origin).pathname.toLowerCase().endsWith('.m3u8');
  } catch {
    return String(src).toLowerCase().includes('.m3u8');
  }
}

function loadHlsScript() {
  if (window.Hls) {
    return Promise.resolve(window.Hls);
  }

  if (!hlsScriptPromise) {
    hlsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${HLS_SCRIPT_SRC}"]`);

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.Hls), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = HLS_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve(window.Hls);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return hlsScriptPromise;
}

function formatTime(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00';
  }

  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  const minutes = Math.floor((value / 60) % 60);
  const hours = Math.floor(value / 3600);

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

function qualityLabel(level) {
  if (!level) return 'Tự động';
  if (level.height) return `${level.height}p`;
  if (level.bitrate) return `${Math.round(level.bitrate / 1000)} kbps`;
  return 'Tùy chỉnh';
}

function VideoPlayer({
  src,
  title = '',
  episodeTitle = '',
  subtitleUrl = '',
  subtitles = [],
  initialTime = 0,
  onProgress,
  onNextEpisode,
  hasNextEpisode = false
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const onProgressRef = useRef(onProgress);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [levels, setLevels] = useState([]);
  const [quality, setQuality] = useState(-1);
  const [settingsView, setSettingsView] = useState('');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const mediaUrl = useMemo(() => resolveMediaUrl(src), [src]);
  const isHls = useMemo(() => isHlsSource(mediaUrl), [mediaUrl]);
  const playableUrl = useMemo(() => (
    mediaUrl && isHls && /^https?:\/\//i.test(mediaUrl)
      ? proxiedMediaUrl(mediaUrl)
      : mediaUrl
  ), [isHls, mediaUrl]);
  const embedUrl = useMemo(() => getEmbedUrl(mediaUrl), [mediaUrl]);
  const resolvedSubtitles = useMemo(() => {
    const tracks = subtitles
      .filter((item) => item?.url)
      .map((item, index) => ({
        id: String(item.id ?? index),
        languageCode: item.languageCode || 'vi',
        label: item.label || 'Phụ đề',
        url: subtitleMediaUrl(item.url),
        isDefault: Boolean(item.isDefault)
      }));

    if (!tracks.length && subtitleUrl) {
      tracks.push({
        id: 'legacy-subtitle',
        languageCode: 'vi',
        label: 'Tiếng Việt',
        url: subtitleMediaUrl(subtitleUrl),
        isDefault: true
      });
    }

    return tracks;
  }, [subtitleUrl, subtitles]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const defaultSubtitle = resolvedSubtitles.find((item) => item.isDefault) || resolvedSubtitles[0];
    setSelectedSubtitleId(defaultSubtitle?.id || '');
    setCaptionsEnabled(Boolean(defaultSubtitle));
  }, [src, resolvedSubtitles]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setError('Trình duyệt đã chặn phát video. Hãy bấm Phát lại.'));
    } else {
      video.pause();
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideControlsTimerRef.current);

    if (videoRef.current && !videoRef.current.paused && !settingsView) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 2400);
    }
  }, [settingsView]);

  const skipBy = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || video.currentTime + seconds));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playableUrl || embedUrl) return undefined;

    let cancelled = false;
    setError('');
    setLevels([]);
    setQuality(-1);
    setBufferedPercent(0);
    setCurrentTime(0);
    hlsRef.current?.destroy?.();
    hlsRef.current = null;
    video.removeAttribute('src');
    video.load();

    if (!isHls) {
      video.src = playableUrl;
      return undefined;
    }

    loadHlsScript()
      .then((Hls) => {
        if (cancelled) {
          return;
        }

        if (!Hls?.isSupported?.()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = playableUrl;
            return;
          }
          setError('Trình duyệt này chưa hỗ trợ phát HLS (.m3u8).');
          return;
        }

        const hls = new Hls();
        hlsRef.current = hls;
        const syncLevels = () => {
          const nextLevels = hls.levels || [];
          if (nextLevels.length) {
            setLevels([...nextLevels]);
          }
        };
        hls.on(Hls.Events.MANIFEST_LOADED, (_, data) => {
          setLevels(data?.levels || hls.levels || []);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          syncLevels();
          setQuality(hls.currentLevel ?? -1);
        });
        if (Hls.Events.LEVELS_UPDATED) {
          hls.on(Hls.Events.LEVELS_UPDATED, syncLevels);
        }
        hls.on(Hls.Events.LEVEL_LOADED, syncLevels);
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          syncLevels();
          setQuality(data?.level ?? hls.currentLevel ?? -1);
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data?.fatal) {
            setError(`Không tải được HLS: ${data.details || 'không xác định'}.`);
          }
        });
        hls.attachMedia(video);
        hls.loadSource(playableUrl);

        let syncAttempts = 0;
        const levelSyncTimer = window.setInterval(() => {
          syncLevels();
          syncAttempts += 1;
          if (syncAttempts >= 20 || hls.levels?.length > 1) {
            window.clearInterval(levelSyncTimer);
          }
        }, 250);
        hls.__levelSyncTimer = levelSyncTimer;
      })
      .catch(() => {
        setError('Không tải được thư viện HLS để phát video .m3u8.');
      });

    return () => {
      cancelled = true;
      if (hlsRef.current?.__levelSyncTimer) {
        window.clearInterval(hlsRef.current.__levelSyncTimer);
      }
      hlsRef.current?.destroy?.();
      hlsRef.current = null;
    };
  }, [embedUrl, isHls, playableUrl]);

  useEffect(() => {
    revealControls();
    return () => window.clearTimeout(hideControlsTimerRef.current);
  }, [isPlaying, revealControls, settingsView]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const syncState = (event) => {
      setCurrentTime(video.currentTime || 0);
      setDuration(video.duration || 0);
      setIsPlaying(!video.paused);
      if (video.buffered.length && video.duration) {
        setBufferedPercent((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
      onProgressRef.current?.({
        currentTime: video.currentTime || 0,
        duration: video.duration || 0,
        paused: video.paused,
        ended: video.ended,
        reason: event?.type || 'update'
      });
    };

    video.addEventListener('play', syncState);
    video.addEventListener('pause', syncState);
    video.addEventListener('timeupdate', syncState);
    video.addEventListener('loadedmetadata', syncState);
    video.addEventListener('durationchange', syncState);
    video.addEventListener('progress', syncState);
    video.addEventListener('ended', syncState);

    return () => {
      video.removeEventListener('play', syncState);
      video.removeEventListener('pause', syncState);
      video.removeEventListener('timeupdate', syncState);
      video.removeEventListener('loadedmetadata', syncState);
      video.removeEventListener('durationchange', syncState);
      video.removeEventListener('progress', syncState);
      video.removeEventListener('ended', syncState);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const targetTime = Number(initialTime || 0);
    if (!video || embedUrl || targetTime <= 0) return undefined;

    const seekToInitialTime = () => {
      const safeTarget = video.duration
        ? Math.min(targetTime, Math.max(video.duration - 1, 0))
        : targetTime;
      video.currentTime = safeTarget;
      setCurrentTime(safeTarget);
    };

    if (video.readyState >= 1) {
      seekToInitialTime();
      return undefined;
    }

    video.addEventListener('loadedmetadata', seekToInitialTime, { once: true });
    return () => video.removeEventListener('loadedmetadata', seekToInitialTime);
  }, [embedUrl, initialTime, playableUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const enterPictureInPicture = () => setIsPictureInPicture(true);
    const leavePictureInPicture = () => setIsPictureInPicture(false);
    video.addEventListener('enterpictureinpicture', enterPictureInPicture);
    video.addEventListener('leavepictureinpicture', leavePictureInPicture);

    return () => {
      video.removeEventListener('enterpictureinpicture', enterPictureInPicture);
      video.removeEventListener('leavepictureinpicture', leavePictureInPicture);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncTracks = () => {
      Array.from(video.querySelectorAll('track')).forEach((trackElement) => {
        const trackId = trackElement.dataset.subtitleId;
        trackElement.track.mode = captionsEnabled && trackId === selectedSubtitleId
          ? 'showing'
          : 'disabled';
      });
    };

    syncTracks();
    const timer = window.setTimeout(syncTracks, 250);
    return () => window.clearTimeout(timer);
  }, [captionsEnabled, resolvedSubtitles, selectedSubtitleId]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (event.key === ' ' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePlay();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        skipBy(-10);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        skipBy(10);
      }

      if (event.key.toLowerCase() === 'm') {
        setMuted((current) => !current);
      }

      if (event.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }

      if (event.key.toLowerCase() === 'c') {
        setCaptionsEnabled((current) => !current);
      }

      if (event.key === 'Escape') {
        setSettingsView('');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipBy, togglePlay]);

  function seekTo(value) {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Number(value);
    setCurrentTime(video.currentTime);
  }

  function toggleFullscreen() {
    const shell = videoRef.current?.closest('.video-player-shell');
    if (!shell) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      shell.requestFullscreen?.();
    }
  }

  async function togglePictureInPicture() {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else {
        await video.requestPictureInPicture();
        setIsPictureInPicture(true);
      }
    } catch {
      setError('Không thể mở chế độ hình trong hình trên trình duyệt này.');
    }
  }

  function selectQuality(nextQuality) {
    const level = Number(nextQuality);
    setQuality(level);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
    setSettingsView('');
  }

  function selectSubtitle(subtitleId) {
    setSelectedSubtitleId(subtitleId);
    setCaptionsEnabled(Boolean(subtitleId));
    setSettingsView('');
  }

  function selectRate(nextRate) {
    setPlaybackRate(Number(nextRate));
    setSettingsView('');
  }

  function openSettings(view = 'main') {
    if (view === 'main' || view === 'quality') {
      const availableLevels = hlsRef.current?.levels || [];
      if (availableLevels.length) {
        setLevels([...availableLevels]);
      }
    }
    setSettingsView((current) => (current === view ? '' : view));
    setControlsVisible(true);
  }

  if (!mediaUrl) {
    return (
      <div className="video-player empty-player">
        <span>Phim này chưa có video để phát.</span>
      </div>
    );
  }

  if (embedUrl) {
    return (
      <div className="video-player-embed-shell">
        <iframe
          className="video-player"
          src={embedUrl}
          title="Video player"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const progressMax = duration || 0;
  const settingsOpen = Boolean(settingsView);
  const currentQualityLabel = quality === -1 ? 'Tự động' : qualityLabel(levels[quality]);
  const selectedSubtitle = resolvedSubtitles.find((item) => item.id === selectedSubtitleId);
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`video-player-shell${isPlaying ? ' is-playing' : ''}${controlsVisible || !isPlaying || settingsOpen ? ' controls-visible' : ' controls-hidden'}`}
      onMouseMove={revealControls}
      onPointerMove={revealControls}
      onMouseLeave={() => {
        if (isPlaying && !settingsOpen) setControlsVisible(false);
      }}
      tabIndex="0"
    >
      <video
        ref={videoRef}
        className="video-player"
        crossOrigin="anonymous"
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onEnded={() => {
          if (hasNextEpisode) onNextEpisode?.();
        }}
        onError={() => setError('Không phát được video. Vui lòng kiểm tra URL hoặc định dạng tệp.')}
      >
        {resolvedSubtitles.map((subtitle) => (
          <track
            key={subtitle.id}
            data-subtitle-id={subtitle.id}
            kind="subtitles"
            src={subtitle.url}
            srcLang={subtitle.languageCode}
            label={subtitle.label}
            default={subtitle.isDefault}
            onLoad={(event) => {
              event.currentTarget.track.mode = captionsEnabled && selectedSubtitleId === subtitle.id
                ? 'showing'
                : 'disabled';
            }}
          />
        ))}
        Your browser does not support video playback.
      </video>

      <button
        className="video-center-play"
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          togglePlay();
        }}
        aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        title={isPlaying ? 'Tạm dừng' : 'Phát'}
      >
        <PlayerIcon name={isPlaying ? 'pause' : 'play'} />
      </button>

      <div className="video-control-top">
        <span className="video-rating-mark" />
        <div className="video-heading">
          <strong>{episodeTitle || title || 'Đang phát'}</strong>
          {title && episodeTitle && <span>{title}</span>}
        </div>
      </div>

      <div className="video-control-bottom" onClick={(event) => event.stopPropagation()}>
        <div className="video-progress-wrap" style={{ '--progress': `${progressPercent}%`, '--buffered': `${bufferedPercent}%` }}>
          <input
            className="video-progress"
            type="range"
            min="0"
            max={progressMax}
            step="0.1"
            value={Math.min(currentTime, progressMax)}
            onChange={(event) => seekTo(event.target.value)}
            aria-label="Tiến độ video"
          />
        </div>
        <div className="video-control-row">
          <button type="button" onClick={togglePlay} aria-label={isPlaying ? 'Tạm dừng' : 'Phát'} title={isPlaying ? 'Tạm dừng' : 'Phát'}>
            <PlayerIcon name={isPlaying ? 'pause' : 'play'} />
          </button>
          <button type="button" onClick={() => skipBy(-10)} aria-label="Tua lại 10 giây" title="Tua lại 10 giây">
            <SeekIcon direction="back" />
          </button>
          <button type="button" onClick={() => skipBy(10)} aria-label="Tua tới 10 giây" title="Tua tới 10 giây">
            <SeekIcon direction="forward" />
          </button>
          <button type="button" onClick={() => setMuted((current) => !current)} aria-label="Âm thanh" title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
            <PlayerIcon name={muted || volume === 0 ? 'muted' : 'volume'} />
          </button>
          <input
            className="video-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(event) => {
              const nextVolume = Number(event.target.value);
              setVolume(nextVolume);
              setMuted(nextVolume === 0);
            }}
            aria-label="Âm lượng"
          />
          <span className="video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <span className="video-control-spacer" />
          {hasNextEpisode && (
            <button type="button" onClick={onNextEpisode} aria-label="Tập tiếp theo" title="Tập tiếp theo">
              <PlayerIcon name="next" />
            </button>
          )}
          {document.pictureInPictureEnabled && (
            <button className={isPictureInPicture ? 'active' : ''} type="button" onClick={togglePictureInPicture} aria-label="Hình trong hình" title="Hình trong hình">
              <PlayerIcon name="pip" />
            </button>
          )}
          <button
            className={captionsEnabled ? 'active' : ''}
            type="button"
            onClick={() => openSettings('captions')}
            aria-label="Phụ đề"
            title="Phụ đề"
          >
            <PlayerIcon name="captions" />
          </button>
          <button type="button" onClick={() => openSettings('main')} aria-label="Cài đặt" title="Cài đặt">
            <PlayerIcon name="settings" />
          </button>
          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
            <PlayerIcon name={isFullscreen ? 'exitFullscreen' : 'fullscreen'} />
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="video-settings-panel" onClick={(event) => event.stopPropagation()}>
          {settingsView !== 'main' && (
            <button className="video-settings-back" type="button" onClick={() => setSettingsView('main')}>
              <span>‹ Quay lại</span>
            </button>
          )}

          {settingsView === 'main' && (
            <>
              <button type="button" onClick={() => setSettingsView('quality')}>
                <span>Chất lượng</span>
                <strong>{currentQualityLabel} &gt;</strong>
              </button>
              <button type="button" onClick={() => setSettingsView('speed')}>
                <span>Tốc độ phát</span>
                <strong>{playbackRate === 1 ? 'Bình thường' : `${playbackRate}x`} &gt;</strong>
              </button>
              <button type="button" onClick={() => setSettingsView('captions')}>
                <span>Phụ đề</span>
                <strong>{captionsEnabled ? selectedSubtitle?.label || 'Bật' : 'Tắt'} &gt;</strong>
              </button>
              <button type="button" onClick={() => setSettingsView('other')}>
                <span>Tùy chọn khác</span>
                <strong>&gt;</strong>
              </button>
            </>
          )}

          {settingsView === 'quality' && (
            <>
              <button className={quality === -1 ? 'active' : ''} type="button" onClick={() => selectQuality(-1)}>
                <span>Tự động</span>
                <strong>{quality === -1 ? 'Đang chọn' : ''}</strong>
              </button>
              {levels.length === 0 && <p>Manifest HLS chưa cung cấp nhiều mức chất lượng.</p>}
              {levels.map((level, index) => (
                <button className={quality === index ? 'active' : ''} type="button" key={`${level.height}-${level.bitrate}-${index}`} onClick={() => selectQuality(index)}>
                  <span>{qualityLabel(level)}</span>
                  <strong>{quality === index ? 'Đang chọn' : ''}</strong>
                </button>
              ))}
            </>
          )}

          {settingsView === 'speed' && PLAYBACK_RATES.map((rate) => (
            <button className={playbackRate === rate ? 'active' : ''} type="button" key={rate} onClick={() => selectRate(rate)}>
              <span>{rate === 1 ? 'Bình thường' : `${rate}x`}</span>
              <strong>{playbackRate === rate ? 'Đang chọn' : ''}</strong>
            </button>
          ))}

          {settingsView === 'captions' && (
            <>
              <button className={!captionsEnabled ? 'active' : ''} type="button" onClick={() => selectSubtitle('')}>
                <span>Tắt</span>
                <strong>{!captionsEnabled ? 'Đang chọn' : ''}</strong>
              </button>
              {resolvedSubtitles.map((subtitle) => (
                <button className={captionsEnabled && selectedSubtitleId === subtitle.id ? 'active' : ''} type="button" key={subtitle.id} onClick={() => selectSubtitle(subtitle.id)}>
                  <span>{subtitle.label}</span>
                  <strong>{captionsEnabled && selectedSubtitleId === subtitle.id ? 'Đang chọn' : ''}</strong>
                </button>
              ))}
              {resolvedSubtitles.length === 0 && <p>Phim này chưa gắn file phụ đề WebVTT.</p>}
            </>
          )}

          {settingsView === 'other' && (
            <>
              <button type="button" onClick={toggleFullscreen}>
                <span>Toàn màn hình</span>
                <strong>Mở</strong>
              </button>
              <button type="button" onClick={() => seekTo(Math.max(currentTime - 10, 0))}>
                <span>Tua lại 10 giây</span>
                <strong>-10</strong>
              </button>
              <button type="button" onClick={() => seekTo(Math.min(currentTime + 10, duration || currentTime + 10))}>
                <span>Tua tới 10 giây</span>
                <strong>+10</strong>
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="video-player-error">
          <strong>{error}</strong>
          <span>{mediaUrl}</span>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
