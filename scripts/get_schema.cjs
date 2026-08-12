const http = require('http');
http.get('http://hispaniaimports.com/DEV_Limpieza/api/schema.php', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { 
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch(e) {
      console.log("Not JSON:", data);
    }
  });
}).on("error", (err) => { console.log("Error: " + err.message); });
