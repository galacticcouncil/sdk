import http from 'node:http';

/**
 * Create proxy server that will forward requests to esbuild local server.
 * @see https://esbuild.github.io/api/#serve-proxy
 */
export function createProxyServer(localServer, proxyPort = 3000) {
  const listenerFn = requestListener(localServer);
  http.createServer(listenerFn).listen(proxyPort);
  console.log(
    '\x1b[1m\x1b[92m',
    '> Proxy: \x1b[4mhttp://' +
      localServer.host +
      ':' +
      proxyPort +
      '/\x1b[0m\n'
  );
}

function requestListener({ host, port }) {
  return function (req, res) {
    const forwardRequest = (path) => {
      const options = {
        hostname: host,
        port: port,
        path,
        method: req.method,
        headers: req.headers,
      };

      const proxyReq = http.request(options, (proxyRes) => {
        // If esbuild local server return 404, use SPA router config for fallback
        if (proxyRes.statusCode === 404) {
          return forwardRequest('/');
        }

        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      req.pipe(proxyReq, { end: true });
    };
    forwardRequest(req.url);
  };
}
