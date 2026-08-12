const http = require('http');
http.get('http://hispaniaimports.com/DEV_Limpieza/api/check_sp.php', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log(data); });
}).on("error", (err) => { console.log("Error: " + err.message); });
