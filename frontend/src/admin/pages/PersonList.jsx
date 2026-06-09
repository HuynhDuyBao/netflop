function PersonList() {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Nhân sự phim</p>
          <h1>Diễn viên / đạo diễn</h1>
        </div>
      </div>
      <div className="admin-card">
        <h2>Đang đồng bộ theo phim</h2>
        <p className="admin-muted">
          Diễn viên và đạo diễn hiện được lưu trong từng phim khi nhập từ TMDb hoặc chỉnh sửa phim.
          Module danh bạ riêng chưa có bảng API độc lập, nên trang này hiển thị trạng thái rõ ràng thay vì dữ liệu giả.
        </p>
      </div>
    </section>
  );
}

export default PersonList;
