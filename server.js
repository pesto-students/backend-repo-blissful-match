var http = require('http');

const port = process.env.port || 3001 ;

const app = require('./src/app');

const server = http.createServer(app);

server.listen(port, () => {
  console.log("http://localhost:" + port);
});
