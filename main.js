const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        title: 'Content Parser',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('./index.html');
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
