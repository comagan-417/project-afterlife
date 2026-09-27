import http from 'node:http';
import { apiMiddleware } from './apiMiddleware.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  await apiMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end('Not Found');
  });
});

server.listen(PORT, () => {
  console.log(`Project Afterlife API server running at http://localhost:${PORT}`);
});
