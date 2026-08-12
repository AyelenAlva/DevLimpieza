const https = require('http');

https.get('http://hispaniaimports.com/DEV_Limpieza/api/index.php?tabla=ciudad', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log(JSON.parse(data)); });
}).on("error", (err) => { console.log("Error: " + err.message); });
