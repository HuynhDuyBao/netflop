import React from "react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export default function HlsPlayer({ src, onQualityChange }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [selected, setSelected] = useState(-1);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setError("");
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return undefined;
    }

    if (!Hls.isSupported()) {
      setError("Trình duyệt này chưa hỗ trợ HLS.");
      return undefined;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false
    });
    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      setLevels(data.levels || []);
      setSelected(-1);
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
      const level = hls.levels[data.level];
      if (level && onQualityChange) {
        onQualityChange(`${level.height || "auto"}p`);
      }
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) setError("Không tải được luồng HLS. Kiểm tra CloudFront URL/CORS.");
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [src, onQualityChange]);

  function changeLevel(value) {
    const parsed = Number(value);
    setSelected(parsed);
    if (hlsRef.current) hlsRef.current.currentLevel = parsed;
  }

  return (
    <div className="player-wrap">
      <video ref={videoRef} controls className="video-player" />
      <div className="player-controls">
        <label>
          Chất lượng
          <select value={selected} onChange={(event) => changeLevel(event.target.value)}>
            <option value={-1}>Auto ABR</option>
            {levels.map((level, index) => (
              <option key={`${level.height}-${index}`} value={index}>
                {level.height ? `${level.height}p` : `Level ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
