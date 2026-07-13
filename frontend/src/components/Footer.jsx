import { Link } from 'react-router-dom';

const DONATE_URL = 'https://quyhyvong.com/ung-ho';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <strong>Netflop</strong>
          <span>Không gian xem phim gọn gàng, dễ tìm và dễ theo dõi cho cộng đồng yêu phim.</span>
        </div>

        <div className="footer-column">
          <h3>Liên hệ</h3>
          <Link to="/contact">Gửi góp ý</Link>
          <Link to="/contact">Báo lỗi phim</Link>
          <Link to="/contact">Đề xuất nội dung</Link>
        </div>

        <div className="footer-column footer-donate">
          <h3>Donate</h3>
          <p>Netflop khuyến khích bạn lan tỏa sự ủng hộ đến những hoàn cảnh cần giúp đỡ.</p>
          <a href={DONATE_URL} target="_blank" rel="noreferrer">Ủng hộ Quỹ Hy Vọng</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
