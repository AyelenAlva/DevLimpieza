const Client = require('ssh2-sftp-client');
const sftp = new Client();

const config = {
  host: 'access-5020084552.webspace-host.com',
  port: 22,
  username: 'a2800198',
  password: 'DEV_Limpieza@2010'
};

async function listRoot() {
  try {
    await sftp.connect(config);
    const list = await sftp.list('/');
    console.log(list.map(item => item.name));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    sftp.end();
  }
}
listRoot();
