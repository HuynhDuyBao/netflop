function Trailer({ youtubeKey }) {
  if (!youtubeKey) {
    return <p>Chưa có trailer.</p>;
  }

  return (
    <div className="trailer-frame">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeKey}`}
        title="Trailer"
        scrolling="no"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default Trailer;
