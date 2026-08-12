const Client = require('ssh2-sftp-client');
const sftp = new Client();
const path = require('path');
const fs = require('fs');

const config = {
  host: 'access-5020084552.webspace-host.com',
  port: 22,
  username: 'a2800198',
  password: 'DEV_Limpieza@2010'
};

async function uploadFrontend() {
  try {
    console.log('Intentando conectar al servidor de IONOS...');
    await sftp.connect(config);
    console.log('✅ Conectado a SFTP de IONOS');
    
    // Check if remote app folder exists (the webspace root is usually / or a subfolder, let's use the root to deploy the frontend)
    // Wait, let's check what the root contains.
    const rootList = await sftp.list('/');
    console.log('Contenido del directorio raíz:', rootList.map(f => f.name).join(', '));
    
    const remoteAppFolder = '/app';
    const exists = await sftp.exists(remoteAppFolder);
    if (!exists) {
      console.log('Creando carpeta /app en servidor remoto...');
      await sftp.mkdir(remoteAppFolder);
    }
    
    // Upload files
    const localDir = path.join(__dirname, '../frontend/dist');
    
    console.log(`Subiendo index.html...`);
    await sftp.fastPut(path.join(localDir, 'index.html'), remoteAppFolder + '/index.html');
    
    const remoteAssetsFolder = remoteAppFolder + '/assets';
    const assetsExists = await sftp.exists(remoteAssetsFolder);
    if (!assetsExists) {
      await sftp.mkdir(remoteAssetsFolder);
    }
    
    const assets = fs.readdirSync(path.join(localDir, 'assets'));
    for (const file of assets) {
      console.log(`Subiendo assets/${file}...`);
      await sftp.fastPut(path.join(localDir, 'assets', file), remoteAssetsFolder + '/' + file);
    }

    console.log('🎉 Frontend subido exitosamente a IONOS. Se puede acceder en /app/');
  } catch (err) {
    console.error('❌ Error durante la subida:', err.message);
  } finally {
    sftp.end();
  }
}

uploadFrontend();
