const Client = require('ssh2-sftp-client');
const sftp = new Client();
const path = require('path');

const config = {
  host: 'access-5020084552.webspace-host.com',
  port: 22,
  username: 'a2800198',
  password: 'DEV_Limpieza@2010'
};

async function uploadFiles() {
  try {
    console.log('Intentando conectar al servidor de IONOS...');
    await sftp.connect(config);
    console.log('✅ Conectado a SFTP de IONOS');
    
    // Check if remote api folder exists
    const remoteApiFolder = '/api';
    const exists = await sftp.exists(remoteApiFolder);
    if (!exists) {
      console.log('Creando carpeta /api en servidor remoto...');
      await sftp.mkdir(remoteApiFolder);
    }
    
    // Upload files
    const localDir = path.join(__dirname, '../api');
    const localDirBackend = __dirname;
    
    const filesToUpload = ['db.php', 'index.php', '.htaccess', 'prueba.php', 'prueba_crud.php', 'desc_persona.php', 'check_sp.php'];
    
    for (const file of filesToUpload) {
      console.log(`Subiendo ${file}...`);
      await sftp.fastPut(path.join(localDir, file), remoteApiFolder + '/' + file);
      console.log(`✅ ${file} subido exitosamente.`);
    }

    // Upload controllers
    const remoteControllersFolder = remoteApiFolder + '/controllers';
    const hasControllers = await sftp.exists(remoteControllersFolder);
    if (!hasControllers) {
      console.log('Creando carpeta /controllers en servidor remoto...');
      await sftp.mkdir(remoteControllersFolder);
    }

    const controllers = ['ClienteController.php', 'EmpleadoController.php', 'DistribuidoraController.php', 'ParametricasController.php'];
    for (const file of controllers) {
      console.log(`Subiendo controllers/${file}...`);
      await sftp.fastPut(path.join(localDir, 'controllers', file), remoteControllersFolder + '/' + file);
      console.log(`✅ controllers/${file} subido exitosamente.`);
    }

    console.log(`Subiendo schema.php...`);
    await sftp.fastPut(path.join(localDirBackend, 'schema.php'), remoteApiFolder + '/schema.php');
    console.log(`✅ schema.php subido exitosamente.`);

    console.log('🎉 Todos los archivos subidos exitosamente a IONOS.');
  } catch (err) {
    console.error('❌ Error durante la subida:', err.message);
  } finally {
    sftp.end();
  }
}

uploadFiles();
