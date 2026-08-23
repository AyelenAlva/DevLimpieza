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

async function uploadFolder(localDir, remoteDir) {
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = remoteDir + '/' + item;
    if (fs.statSync(localPath).isDirectory()) {
      const exists = await sftp.exists(remotePath);
      if (!exists) {
        await sftp.mkdir(remotePath);
      }
      await uploadFolder(localPath, remotePath);
    } else {
      console.log(`Subiendo ${item}...`);
      await sftp.fastPut(localPath, remotePath);
    }
  }
}

async function uploadBackend() {
  try {
    console.log('Intentando conectar al servidor de IONOS...');
    await sftp.connect(config);
    console.log('✅ Conectado a SFTP de IONOS');
    
    const remoteApiFolder = '/api';
    const exists = await sftp.exists(remoteApiFolder);
    if (!exists) {
      console.log('Creando carpeta /api en servidor remoto...');
      await sftp.mkdir(remoteApiFolder);
    }
    
    const localDir = path.join(__dirname, '../api');
    await uploadFolder(localDir, remoteApiFolder);

    console.log('🎉 Backend subido exitosamente a IONOS. Se puede acceder en /api/');
  } catch (err) {
    console.error('❌ Error durante la subida:', err.message);
  } finally {
    sftp.end();
  }
}

uploadBackend();
