'use strict'

/*
  This file needs to be written in ES5 unfortunately.
  Everything else can be ES6 :)
*/

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    'web-preferences': {
      'web-security': false
    }
  })

  mainWindow.loadURL('file://' + __dirname + '/index.html')

  /* Don't do it or it will open in production as well
    mainWindow.webContents.openDevTools()
  */

  mainWindow.on('closed', function() {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
