import { useEffect, useState } from 'react';

function UserAvatar({ alt = '', className = '', name = 'U', src }) {
  const [failed, setFailed] = useState(false);
  const fallback = String(name || 'U').trim().slice(0, 1).toUpperCase() || 'U';

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <span className={className}>
        <img src={src} alt={alt} onError={() => setFailed(true)} />
      </span>
    );
  }

  return <span className={className}>{fallback}</span>;
}

export default UserAvatar;
