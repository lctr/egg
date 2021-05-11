const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 500,
    height: 350,
    darkTheme: true,
    backgroundColor: "#75000000",
    titleBarStyle: "hiddenInset",
    visualEffectState: "followWindow",
    vibrancy: "under-window",
    webPreferences: {
      nodeIntegration: true,
      textAreasAreResizable: false,
      defaultFontFamily: {
        standard: "Helvetica"
      },
      spellcheck: false,

    }
  });
  win.loadURL(`file://${ app.getAppPath() }/static/index.html`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

require('./menu');



