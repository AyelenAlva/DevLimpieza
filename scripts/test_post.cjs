const http = require('http');

const data = JSON.stringify({
  tipo_persona: 'F',
  nombre: 'Test',
  apellido: 'Test',
  telefono: '123456789',
  email: 'test@test.com',
  direccion: 'Calle Falsa 123',
  id_ciudad: 1,
  id_estado: 1
});

const options = {
  hostname: 'hispaniaimports.com',
  path: '/DEV_Limpieza/api/index.php?action=alta_cliente',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => { console.log(body); });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
