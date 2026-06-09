import { useEffect, useRef, useState } from 'react';

function FileUrlInput({
  accept = '*/*',
  label,
  name,
  onChange,
  onUpload,
  placeholder,
  value
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const objectUrlRef = useRef('');

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  function emitChange(nextValue) {
    onChange?.({
      target: {
        name,
        value: nextValue,
        type: 'text',
        checked: false
      }
    });
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    if (onUpload) {
      try {
        setUploading(true);
        const uploadedUrl = await onUpload(file);
        emitChange(uploadedUrl);
      } catch (uploadError) {
        setError(uploadError.response?.data?.message || 'Upload tệp thất bại.');
      } finally {
        setUploading(false);
        event.target.value = '';
      }
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    emitChange(objectUrl);
    event.target.value = '';
  }

  return (
    <label className="file-url-field">
      <span>{label}</span>
      <div className="file-url-control">
        <input
          className="input"
          name={name}
          value={value}
          onChange={(event) => {
            setFileName('');
            emitChange(event.target.value);
          }}
          placeholder={placeholder || label}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Đang tải...' : 'Thêm tệp'}
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden-file"
          type="file"
          accept={accept}
          onChange={handleFileChange}
        />
      </div>
      {fileName && <small>Đã chọn: {fileName}</small>}
      {error && <small className="file-url-error">{error}</small>}
    </label>
  );
}

export default FileUrlInput;
