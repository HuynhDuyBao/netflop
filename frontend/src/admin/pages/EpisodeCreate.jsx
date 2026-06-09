import { Link } from 'react-router-dom';
import UploadVideo from '../components/UploadVideo.jsx';

function EpisodeCreate() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Video</p>
          <h1>Tải tập phim</h1>
        </div>
        <Link className="button secondary" to="/admin/episodes">Quản lý tập phim</Link>
      </div>
      <div className="admin-card">
        <UploadVideo />
      </div>
    </section>
  );
}

export default EpisodeCreate;
