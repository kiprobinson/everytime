'use strict';

//to run from node: npm run start
//to generate exe:  npm run package

const {app, Tray, Menu, BrowserWindow} = require('electron');
const ipc = require('electron').ipcMain;
const moment = require('moment-timezone');
const path = require('path');
const url = require('url');
const config = require('./config');
const {utils} = require('./utils');

const isMacOs = process.platform === 'darwin';

const trayIcon = isMacOs ? 'tray-icon-Template.png' : 'tray-icon-invert.ico';
const appIcon = isMacOs ? 'app-icon.icns' : 'app-icon.ico';

const trayIconPath = path.join(__dirname, `icons/${trayIcon}`);
const appIconPath = path.join(__dirname, `icons/${appIcon}`);
const dockIconPath = path.join(__dirname, 'icons/app-icon.png');

let tray = null;
let settingsWin = null;
let planningWin = null;
let menuVisible = false;

/*

TODO:

Settings dialog- make selection for new timezone a typeahead.
Create MSI installer with https://stackoverflow.com/questions/36398955/electron-create-msi-installer-using-electron-builder

*/


function updateContextMenu() {
  //don't update the menu item while it is visible. try again in 5 seconds.
  if(menuVisible)
    return;
  
  const localTz = moment.tz.guess(true);
  const ts = moment.tz(localTz);
  const template = [];
  
  //start with i=-1, which indicates local time zone which is always drawn at the top with a separator.
  for(let i = -1; i < config.timezones.length; i++) {
    const tz = (i < 0 ? {code: localTz, label: 'Local Time'} : config.timezones[i]);
    const formatted = utils.formatTimestamp(ts, tz, config);
    const diffDay = formatDayDiff(formatted.dayDiff);
    
    if(isMacOs)
      template.push({label: `${formatted.tzTime}${diffDay} - ${formatted.label}`});
    else
      template.push({label: formatted.label, sublabel: `${formatted.tzTime}${diffDay}`});
    
    if(i < 0)
      template.push({type: 'separator'});
  }
  
  template.push({type: 'separator'});
  template.push({label: 'Planning...', click: showPlanning});
  template.push({label: 'Settings...', click: showSettings});
  template.push({label: 'Quit', click: () => app.exit(0)});
  
  let menu = Menu.buildFromTemplate(template);
  menu.on('menu-will-show', function() { menuVisible = true; });
  menu.on('menu-will-close', function() { menuVisible = false; updateContextMenu(); });
  tray.setContextMenu(menu);
}

function formatDayDiff(diff) {
  if(diff === 0)
    return '';
  if(diff === -1)
    return ' (yesterday)';
  if(diff === 1)
    return ' (tomorrow)';
  
  const sign = diff < 0 ? '-' : '+';
  const num = Math.abs(diff);
  
  return ` (${sign}${num} days)`;
}

function initSettingsWindow() {
  //initialize settings window but don't display yet.
  settingsWin = new BrowserWindow({
    title: 'Everytime Settings',
    width: 700,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    show: false,
    icon: appIconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  settingsWin.setMenu(null);
  
  settingsWin.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true,
  }));
  
  settingsWin.on('close', function(e) {
    //on close, just hide the window instead of closing
    e.preventDefault();
    settingsWin.hide();
  });
}

function showSettings() {
  settingsWin.webContents.send('send-config', config.serialize());
  settingsWin.show();
}

function initPlanningWindow() {
  //initialize settings window but don't display yet.
  planningWin = new BrowserWindow({
    title: 'Everytime Planning',
    width: 700,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    show: false,
    icon: appIconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  planningWin.setMenu(null);
  
  planningWin.loadURL(url.format({
    pathname: path.join(__dirname, 'planning.html'),
    protocol: 'file:',
    slashes: true,
  }));
  
  planningWin.on('close', function(e) {
    //on close, just hide the window instead of closing
    e.preventDefault();
    planningWin.hide();
  });
}

function showPlanning() {
  if(planningWin.isVisible()) {
    planningWin.focus();
  }
  else{
    planningWin.webContents.send('send-config', config.serialize());
    planningWin.webContents.send('before-show');
    planningWin.show();
  }
}

app.on('ready', function() {
  tray = new Tray(trayIconPath);
  
  if(isMacOs) {
    app.dock.setIcon(dockIconPath);
    app.dock.hide();
  }
  
  config.loadConfig();
  initSettingsWindow();
  initPlanningWindow();
  
  ipc.on('config-updated', function(e, _config) {
    config.autoLaunch = _config.autoLaunch;
    config.timeFormat = _config.timeFormat;
    config.offsetDisplay = _config.offsetDisplay;
    config.timezones = _config.timezones;
    config.saveConfig();
    updateContextMenu();
    planningWin.webContents.send('send-config', config.serialize());
  });
  
  tray.on('double-click', showPlanning);
  
  ipc.on('debug-message', (e, m) => console.log(m));
  
  //function runs at the start of every minute to update menu
  let updateTimer = function() {
    updateContextMenu();
    setTimeout(updateTimer, 60000 - (Date.now() % 60000));
  };
  updateTimer();
});
