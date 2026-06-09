const http = require('http');
const https = require('https');

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^0\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^\[?::1\]?$/i
];

function isPrivateHost(hostname) {
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function parseTargetUrl(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    if (isPrivateHost(parsedUrl.hostname)) {
      return null;
    }

    return parsedUrl;
  } catch {
    return null;
  }
}

function proxiedUrl(targetUrl, proxyOrigin) {
  return `${proxyOrigin}/api/media-proxy?url=${encodeURIComponent(targetUrl)}`;
}

function absolutizeUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function rewriteAttributeUris(line, baseUrl, proxyOrigin) {
  return line.replace(/URI="([^"]+)"/g, (_, uri) => {
    const absoluteUrl = absolutizeUrl(uri, baseUrl);
    return `URI="${proxiedUrl(absoluteUrl, proxyOrigin)}"`;
  });
}

function rewriteHlsPlaylist(content, baseUrl, proxyOrigin) {
  return content
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return line;
      }

      if (trimmed.startsWith('#')) {
        return rewriteAttributeUris(line, baseUrl, proxyOrigin);
      }

      return proxiedUrl(absolutizeUrl(trimmed, baseUrl), proxyOrigin);
    })
    .join('\n');
}

function isHlsResponse(targetUrl, contentType = '') {
  return (
    targetUrl.pathname.toLowerCase().endsWith('.m3u8')
    || contentType.toLowerCase().includes('mpegurl')
  );
}

function requestUpstream(targetUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = targetUrl.protocol === 'https:' ? https : http;
    const request = client.get(
      targetUrl,
      {
        headers,
        rejectUnauthorized: false
      },
      resolve
    );

    request.on('error', reject);
  });
}

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function proxyMedia(req, res, next) {
  const targetUrl = parseTargetUrl(req.query.url);

  if (!targetUrl) {
    res.status(400).json({ success: false, message: 'URL media khong hop le.' });
    return;
  }

  try {
    const upstreamResponse = await requestUpstream(
      targetUrl,
      req.headers.range ? { Range: req.headers.range } : {}
    );

    if (upstreamResponse.statusCode < 200 || upstreamResponse.statusCode >= 300) {
      res.status(upstreamResponse.statusCode).json({
        success: false,
        message: 'Khong tai duoc media.'
      });
      return;
    }

    const contentType = upstreamResponse.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');

    if (isHlsResponse(targetUrl, contentType)) {
      const playlist = (await readStream(upstreamResponse)).toString('utf8');
      const proxyOrigin = `${req.protocol}://${req.get('host')}`;
      res.type('application/vnd.apple.mpegurl').send(
        rewriteHlsPlaylist(playlist, targetUrl.toString(), proxyOrigin)
      );
      return;
    }

    const contentLength = upstreamResponse.headers['content-length'];
    const contentRange = upstreamResponse.headers['content-range'];
    const acceptRanges = upstreamResponse.headers['accept-ranges'];

    res.status(upstreamResponse.statusCode);
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

    upstreamResponse.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  proxyMedia
};
