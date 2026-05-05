const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sshConnect: (params) => ipcRenderer.invoke('ssh:connect', params),
  sshOpenShell: (connectionId) => ipcRenderer.invoke('ssh:openShell', connectionId),
  sshDisconnect: (connectionId) => ipcRenderer.invoke('ssh:disconnect', connectionId),
  
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal:data', (event, data) => callback(data));
  },
  onTerminalClose: (callback) => {
    ipcRenderer.on('terminal:close', (event, data) => callback(data));
  },
  terminalWrite: (connectionId, data) => ipcRenderer.send('terminal:write', { connectionId, data }),
  terminalResize: (connectionId, cols, rows) => ipcRenderer.send('terminal:resize', { connectionId, cols, rows }),

  sftpList: (connectionId, dirPath) => ipcRenderer.invoke('sftp:list', { connectionId, dirPath }),
  sftpDownload: (connectionId, remotePath, localPath) => ipcRenderer.invoke('sftp:download', { connectionId, remotePath, localPath }),
  sftpUpload: (connectionId, buffer, remotePath) => ipcRenderer.invoke('sftp:upload', { connectionId, buffer, remotePath }),
  sftpDelete: (connectionId, remotePath) => ipcRenderer.invoke('sftp:delete', { connectionId, remotePath }),
  sftpMkdir: (connectionId, dirPath) => ipcRenderer.invoke('sftp:mkdir', { connectionId, dirPath }),

  loadHosts: () => ipcRenderer.invoke('hosts:load'),
  saveHosts: (hosts) => ipcRenderer.invoke('hosts:save', hosts),

  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
  windowIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  hostCheck: (params) => ipcRenderer.invoke('host:check', params),
});