import { useState } from 'react';
import { Link } from 'react-router-dom';
import { contactApi } from '../services/contactApi.js';

const DONATE_URL = 'https://quyhyvong.com/ung-ho';

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setSubmitted(false);
    setError('');

    try {
      await contactApi.send({
        name: formData.get('name'),
        email: formData.get('email'),
        topic: formData.get('topic'),
        message: formData.get('message')
      });
      setSubmitted(true);
      form.reset();
    } catch (sendError) {
      setError(sendError.response?.data?.message || 'Không gửi được liên hệ. Bạn vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div>
          <span>Netflop</span>
          <h1>Liên hệ và đồng hành</h1>
          <p>
            Nếu bạn gặp lỗi khi xem phim, muốn góp ý giao diện, đề xuất phim mới hoặc cần hỗ trợ tài khoản,
            hãy gửi thông tin cho Netflop. Mỗi phản hồi đều giúp website tốt hơn cho cộng đồng yêu phim.
          </p>
        </div>
      </section>

      <section className="contact-layout">
        <div className="contact-main">
          <section className="contact-card">
            <div className="contact-heading">
              <span>Liên hệ</span>
              <h2>Gửi góp ý cho Netflop</h2>
              <p>Hãy mô tả ngắn gọn vấn đề bạn gặp phải. Nếu là lỗi phim, bạn nên ghi kèm tên phim và tập phim.</p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <label>
                Họ tên
                <input name="name" type="text" placeholder="Nhập họ tên của bạn" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="Nhập email để nhận phản hồi" required />
              </label>
              <label>
                Chủ đề
                <select name="topic" defaultValue="feedback">
                  <option value="feedback">Góp ý website</option>
                  <option value="movie">Báo lỗi phim / tập phim</option>
                  <option value="account">Hỗ trợ tài khoản</option>
                  <option value="partner">Hợp tác nội dung</option>
                </select>
              </label>
              <label>
                Nội dung
                <textarea name="message" rows="6" placeholder="Bạn muốn nhắn gì cho Netflop?" required />
              </label>
              <button type="submit" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi liên hệ'}</button>
              {submitted && <p className="contact-success">Netflop đã ghi nhận nội dung của bạn. Cảm ơn bạn đã góp ý.</p>}
              {error && <p className="form-error">{error}</p>}
            </form>
          </section>

          <section className="contact-card contact-note-card">
            <div className="contact-heading">
              <span>Thông điệp</span>
              <h2>Cùng xây dựng một nơi xem phim dễ chịu hơn</h2>
            </div>
            <p>
              Netflop mong muốn giữ trải nghiệm xem phim gọn gàng, dễ tìm, dễ xem và ít làm phiền nhất có thể.
              Những góp ý nhỏ như lỗi phụ đề, tập phim bị sai, poster chưa đẹp hay danh mục chưa hợp lý đều rất đáng giá.
            </p>
            <p>
              Nếu bạn muốn ủng hộ, Netflop khuyến khích bạn dành sự quan tâm đó cho những hoàn cảnh cần giúp đỡ ngoài xã hội.
              Một hành động tử tế có thể không ồn ào, nhưng có thể làm ngày mai của ai đó sáng hơn.
            </p>
          </section>
        </div>

        <aside className="donate-panel" id="donate">
          <span className="donate-kicker">Donate</span>
          <h2>Lan tỏa yêu thương qua Quỹ Hy Vọng</h2>
          <p>
            Thay vì gửi donate cho Netflop, bạn có thể cùng chúng tôi hướng sự ủng hộ đến những em nhỏ,
            gia đình và hoàn cảnh đang cần thêm một bàn tay nâng đỡ.
          </p>
          <div className="donate-alert">
            Netflop không nhận donate cá nhân. Nếu bạn muốn ủng hộ, hãy gửi trực tiếp đến Quỹ Hy Vọng.
          </div>
          <a className="donate-button" href={DONATE_URL} target="_blank" rel="noreferrer">
            Ủng hộ tại Quỹ Hy Vọng
          </a>
          <a className="donate-link" href={DONATE_URL} target="_blank" rel="noreferrer">
            quyhyvong.com/ung-ho
          </a>
          <p className="donate-small">
            Mỗi đóng góp, dù nhỏ, đều có thể góp phần thắp sáng hy vọng cho người đang cần được giúp đỡ.
          </p>
          <Link className="donate-back-link" to="/movies?sort=popular">Tiếp tục xem phim</Link>
        </aside>
      </section>
    </main>
  );
}

export default Contact;
