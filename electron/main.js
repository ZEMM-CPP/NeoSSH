const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');
const SSHManager = require('../core/sshManager');

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f1117',
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file://')) {
      e.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Renderer] Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Renderer] Process gone:', details.reason, details.exitCode);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('[Renderer] Crashed');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[App] Loading:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Terminal streaming: renderer -> main (user input)
ipcMain.on('terminal:write', (event, { connectionId, data }) => {
  SSHManager.write(connectionId, data);
});

// Terminal streaming: renderer -> main (resize)
ipcMain.on('terminal:resize', (event, { connectionId, cols, rows }) => {
  SSHManager.resize(connectionId, cols, rows);
});

// Connect to SSH host (base connection only)
ipcMain.handle('ssh:connect', async (event, { host, port, username, password, privateKey }) => {
  try {
    const connection = await SSHManager.connect({ host, port, username, password, privateKey });
    return { success: true, connectionId: connection.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open shell for terminal session
ipcMain.handle('ssh:openShell', async (event, connectionId) => {
  try {
    const stream = await SSHManager.openShell(connectionId);
    
    stream.on('data', (data) => {
      event.sender.send('terminal:data', { connectionId, data: data.toString('utf-8') });
    });

    stream.on('close', () => {
      event.sender.send('terminal:close', { connectionId });
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ssh:disconnect', async (event, connectionId) => {
  try {
    await SSHManager.disconnect(connectionId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// SFTP operations
ipcMain.handle('sftp:list', async (event, { connectionId, dirPath }) => {
  try {
    const files = await SSHManager.sftpList(connectionId, dirPath);
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sftp:download', async (event, { connectionId, remotePath, localPath }) => {
  try {
    await SSHManager.sftpDownload(connectionId, remotePath, localPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sftp:upload', async (event, { connectionId, buffer, remotePath }) => {
  console.log('[SFTP Upload] connection:', connectionId, 'path:', remotePath, 'buffer type:', typeof buffer, 'buffer size:', buffer?.byteLength ?? 0);
  try {
    const buf = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    console.log('[SFTP Upload] buffer created:', buf.length, 'bytes');
    await SSHManager.sftpUploadFromBuffer(connectionId, buf, remotePath);
    console.log('[SFTP Upload] success');
    return { success: true };
  } catch (error) {
    console.error('[SFTP Upload] error:', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sftp:delete', async (event, { connectionId, remotePath }) => {
  try {
    await SSHManager.sftpDelete(connectionId, remotePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sftp:mkdir', async (event, { connectionId, dirPath }) => {
  try {
    await SSHManager.sftpMkdir(connectionId, dirPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

const HOSTS_FILE = path.join(app.getPath('userData'), 'hosts.json');

ipcMain.handle('hosts:load', async () => {
  try {
    if (!fs.existsSync(HOSTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(HOSTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('hosts:save', async (event, hosts) => {
  try {
    fs.writeFileSync(HOSTS_FILE, JSON.stringify(hosts, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('host:check', async (event, { host, port }) => {
  const isReachable = await SSHManager.checkHost(host, port, 5000);
  return { success: true, reachable: isReachable };
});