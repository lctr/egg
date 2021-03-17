const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 500,
    height: 350,
    darkTheme: true,
    backgroundColor: "#80111111",
    // titleBarStyle: "hiddenInset",
    visualEffectState: "followWindow",
    vibrancy: "sheet",
    webPreferences: {
      nodeIntegration: true,
      textAreasAreResizable: false,
      defaultFontFamily: {
        standard: "Helvetica"
      },
      spellcheck: false,

    }
  });
  win.loadFile('src/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  /* if (process.platform !== 'darwin') */ app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Create menu template
const mainMenuTemplate = [
  {
    label: "File",
    submenu: [
      { label: 'New' },
      { label: 'Open' },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click () { app.quit(); }
      }
    ]
  }
];