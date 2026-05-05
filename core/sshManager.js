const { Client } = require('ssh2');
const net = require('net');
const fs = require('fs');

class SSHManager {
  constructor() {
    this.connections = new Map();
    this.sftpChannels = new Map();
  }

  connect({ host, port = 22, username, password, privateKey }) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const connectionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const config = {
        host,
        port,
        username,
        readyTimeout: 20000,
        keepaliveInterval: 30000,
        keepaliveCountMax: 3,
      };

      if (privateKey && privateKey.trim() !== '') {
        try {
          config.privateKey = fs.readFileSync(privateKey);
          if (password) {
            config.passphrase = password;
          }
        } catch (err) {
          reject(new Error(`Failed to read private key: ${err.message}`));
          return;
        }
      } else if (password) {
        config.password = password;
      }

      conn.on('ready', () => {
        this.connections.set(connectionId, { conn, host, username, stream: null });
        resolve({ id: connectionId, host, username });
      });

      conn.on('error', (err) => {
        reject(err);
      });

      conn.on('close', () => {
        this.connections.delete(connectionId);
        this.sftpChannels.delete(connectionId);
      });

      conn.connect(config);
    });
  }

  openShell(connectionId) {
    const connObj = this.connections.get(connectionId);
    if (!connObj) return Promise.reject(new Error('Connection not found'));
    if (connObj.stream) return Promise.resolve(connObj.stream);

    return new Promise((resolve, reject) => {
      connObj.conn.shell((err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        connObj.stream = stream;
        resolve(stream);
      });
    });
  }

  write(connectionId, data) {
    const connObj = this.connections.get(connectionId);
    if (!connObj) return;
    connObj.stream.write(data);
  }

  resize(connectionId, cols, rows) {
    const connObj = this.connections.get(connectionId);
    if (!connObj) return;
    connObj.stream.setWindow(rows, cols);
  }

  disconnect(connectionId) {
    const connObj = this.connections.get(connectionId);
    if (!connObj) return Promise.resolve();
    if (connObj.stream) {
      try { connObj.stream.end(); } catch (_) {}
    }
    try { connObj.conn.end(); } catch (_) {}
    this.connections.delete(connectionId);
    this.sftpChannels.delete(connectionId);
    return Promise.resolve();
  }

  // SFTP methods
  getSFTP(connectionId) {
    if (this.sftpChannels.has(connectionId)) {
      return Promise.resolve(this.sftpChannels.get(connectionId));
    }

    const connObj = this.connections.get(connectionId);
    if (!connObj) {
      return Promise.reject(new Error('Connection not found'));
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SFTP channel timeout'));
      }, 15000);

      connObj.conn.sftp((err, sftp) => {
        clearTimeout(timeout);
        if (err) {
          reject(err);
          return;
        }
        this.sftpChannels.set(connectionId, sftp);
        resolve(sftp);
      });
    });
  }

  async sftpList(connectionId, dirPath = '/') {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SFTP list timeout')), 15000);
      sftp.readdir(dirPath, (err, list) => {
        clearTimeout(timeout);
        if (err) { reject(err); return; }
        const files = list.map((item) => ({
          name: item.filename,
          longname: item.longname,
          size: item.attrs.size,
          modified: item.attrs.mtime,
          isDirectory: this.isDirectory(item.attrs),
        }));
        files.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        resolve(files);
      });
    });
  }

  async sftpDownload(connectionId, remotePath, localPath) {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SFTP download timeout')), 60000);
      const writeStream = fs.createWriteStream(localPath);
      const readStream = sftp.createReadStream(remotePath);
      readStream.pipe(writeStream);
      writeStream.on('finish', () => { clearTimeout(timeout); resolve(); });
      writeStream.on('error', (err) => { clearTimeout(timeout); reject(err); });
      readStream.on('error', (err) => { clearTimeout(timeout); reject(err); });
    });
  }

  async sftpUpload(connectionId, localPath, remotePath) {
    const sftp = await this.getSFTP(connectionId);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SFTP upload timeout')), 60000);
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      readStream.pipe(writeStream);
      writeStream.on('finish', () => { clearTimeout(timeout); resolve(); });
      writeStream.on('error', (err) => { clearTimeout(timeout); reject(err); });
      readStream.on('error', (err) => { clearTimeout(timeout); reject(err); });
    });
  }

  async sftpUploadFromBuffer(connectionId, buffer, remotePath) {
    console.log('[SSHManager] uploadFromBuffer:', connectionId, remotePath, buffer.length, 'bytes');
    const sftp = await this.getSFTP(connectionId);
    console.log('[SSHManager] SFTP channel obtained');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SFTP upload timeout')), 60000);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('error', (err) => { clearTimeout(timeout); reject(err); });
      writeStream.on('finish', () => { clearTimeout(timeout); console.log('[SSHManager] upload finished'); resolve(); });
      writeStream.write(buffer);
      writeStream.end();
    });
  }

  async sftpDelete(connectionId, remotePath) {
    const sftp = await this.getSFTP(connectionId);
    const stats = await new Promise((resolve, reject) => {
      sftp.stat(remotePath, (err, stats) => err ? reject(err) : resolve(stats));
    });
    if (this.isDirectory(stats)) {
      await new Promise((resolve, reject) => {
        sftp.rmdir(remotePath, (err) => err ? reject(err) : resolve());
      });
    } else {
      await new Promise((resolve, reject) => {
        sftp.unlink(remotePath, (err) => err ? reject(err) : resolve());
      });
    }
  }

  async sftpMkdir(connectionId, dirPath) {
    const sftp = await this.getSFTP(connectionId);
    await new Promise((resolve, reject) => {
      sftp.mkdir(dirPath, (err) => err ? reject(err) : resolve());
    });
  }

  isDirectory(attrs) {
    return (attrs.mode & 0o170000) === 0o40000;
  }

  checkHost(host, port = 22, timeout = 5000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve(false);
      });

      socket.connect(port, host);
    });
  }
}

module.exports = new SSHManager();