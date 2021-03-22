const { app, BrowserWindow, Menu } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 500,
    height: 350,
    darkTheme: true,
    backgroundColor: "#80111111",
    titleBarStyle: "hiddenInset",
    visualEffectState: "followWindow",
    vibrancy: "hud",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      textAreasAreResizable: false,
      defaultFontFamily: {
        standard: "Helvetica"
      },
      spellcheck: false,

    }
  });
  win.loadURL(`file://${ app.getAppPath() }/src/index.html`);
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


// add empty object to menu for mac
if (process.platform == 'darwin') { mainMenuTemplate.unshift({}); }

// add dev tools if not in prod
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click (item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  });
}




