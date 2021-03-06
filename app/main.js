'use strict'

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const DEBUG = true
const ALWAYS_ON_TOP = true
let mainWindow


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    alwaysOnTop: ALWAYS_ON_TOP,
    'web-preferences': {
      'web-security': false
    }
  })

  mainWindow.loadURL('file://' + __dirname + '/index.html')

  /* Don't do it or it will open in production as well */
  if (DEBUG) {
      mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('will-quit', () => {
  console.log("will-quit")
})

/*
const Tray = electron.Tray
const Menu = electron.Menu

let appIcon = null;
app.on('ready', () => {
  appIcon = new Tray('icon.png');
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Item1', type: 'radio'},
    {label: 'Item2', type: 'radio'},
    {label: 'Item3', type: 'radio', checked: true},
    {label: 'Item4', type: 'radio'}
  ]);
  appIcon.setToolTip('This is my application.');
  appIcon.setContextMenu(contextMenu);
});


// const Menu = electron.Menu;

const dockMenu = Menu.buildFromTemplate([
  { label: 'New Window', click() { console.log('New Window'); } },
  { label: 'New Window with Settings', submenu: [
    { label: 'Basic' },
    { label: 'Pro'}
  ]},
  { label: 'New Command...'}
]);
app.dock.setMenu(dockMenu);
*/
