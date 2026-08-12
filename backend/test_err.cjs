const http = require('http');
http.get('http://hispaniaimports.com/DEV_Limpieza/api/index.php?action=crud_cliente', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { 
    console.log(data);
  });
}).on("error", (err) => { console.log("Error: " + err.message); });
