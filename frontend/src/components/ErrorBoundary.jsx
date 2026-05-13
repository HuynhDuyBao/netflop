import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page">
          <div className="panel">
            <h1>Ứng dụng gặp lỗi khi hiển thị</h1>
            <p className="error-text">{this.state.error.message}</p>
            <button className="primary-btn" onClick={() => window.location.reload()}>
              Tải lại
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
