'use strict';

//to run from node: npm run start
//to generate exe:  npm run package

const {app, Tray, Menu, BrowserWindow} = require('electron');
const ipc = require('electron').ipcMain;
const moment = require('moment-timezone');
const path = require('path');
const url = require('url');
const config = require('./config');

const iconPath = path.join(__dirname, 'icons/tray-icon-invert.ico');


let tray = null;
let settingsWin = null;
let menuVisible = false;

/*

TODO:

Settings dialog- make selection for new timezone a typeahead.
Create MSI installer with https://stackoverflow.com/questions/36398955/electron-create-msi-installer-using-electron-builder

*/


function formatOffsetMins(offsetMins) {
  let sign = (offsetMins < 0 ? '-' : '+');
  let hrs = Math.floor(Math.abs(offsetMins) / 60);
  hrs = (hrs < 10 ? '0' : '') + String(hrs);
  let mins = Math.abs(offsetMins) % 60;
  mins = (mins < 10 ? '0' : '') + String(mins);
  return sign + hrs + mins;
}

function updateContextMenu() {
  //don't update the menu item while it is visible. try again in 5 seconds.
  if(menuVisible)
    return;
  
  let ts = moment();
  
  const timeFormat = (config.timeFormat === 24 ? 'HH:mm' : 'h:mm A');
  const showUtcOffset = (config.offsetDisplay === 'both' || config.offsetDisplay === 'utc');
  const showLocalOffset = (config.offsetDisplay === 'both' || config.offsetDisplay === 'local');
  
  let template = [];
  
  let localTz = moment.tz.guess(true);
  let localDate = Number(ts.tz(localTz).format('YYYYMMDD'));
  let localOffsetMins = ts.tz(localTz).utcOffset();
  
  //start with i=-1, which indicates local time zone which is always drawn at the top with a separator.
  for(let i = -1; i < config.timezones.length; i++) {
    let tz = (i < 0 ? {code: localTz, label: 'Local Time'} : config.timezones[i]);
    let offsetMins = ts.tz(tz.code).utcOffset();
    let tzDate = Number(ts.tz(tz.code).format('YYYYMMDD'));
    let diffDay = (tzDate < localDate ? ' (yesterday)' : (tzDate > localDate ? ' (tomorrow)' : ''));
    let tzTime = ts.tz(tz.code).format(timeFormat);
    
    let offsetVsUtc = formatOffsetMins(offsetMins);
    let offsetVsLocal = formatOffsetMins(offsetMins - localOffsetMins);
    
    let offsetDisplays = [];
    if(showUtcOffset)
      offsetDisplays.push(`UTC${offsetVsUtc}`);
    if(showLocalOffset)
      offsetDisplays.push(`Local${offsetVsLocal}`);
    
    let offsetDisplay = offsetDisplays.join(', ');
    if(offsetDisplay !== '')
      offsetDisplay = ` (${offsetDisplay})`;
    
    let labelDisplay = (tz.label === '' ? tz.code : tz.label);
    
    template.push({label: `${labelDisplay}${offsetDisplay}`, sublabel: `${tzTime}${diffDay}`});
    if(i < 0)
      template.push({type: 'separator'});
  }
  
  template.push({type: 'separator'});
  template.push({label: 'Settings...', click: showSettings});
  template.push({label: 'Quit', click: () => app.exit(0)});
  
  let menu = Menu.buildFromTemplate(template);
  menu.on('menu-will-show', function() { menuVisible = true; });
  menu.on('menu-will-close', function() { menuVisible = false; updateContextMenu(); });
  tray.setContextMenu(menu);
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
    icon: path.join(__dirname, 'icons/app-icon.ico'),
    webPreferences: {
      nodeIntegration: true
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

app.on('ready', function() {
  tray = new Tray(iconPath);
  
  config.loadConfig();
  initSettingsWindow();
  
  ipc.on('config-updated', function(e, _config) {
    config.autoLaunch = _config.autoLaunch;
    config.timeFormat = _config.timeFormat;
    config.offsetDisplay = _config.offsetDisplay;
    config.timezones = _config.timezones;
    config.saveConfig();
    updateContextMenu();
  });
  
  ipc.on('debug-message', (e, m) => console.log(m));
  
  //function runs at the start of every minute to update menu
  let updateTimer = function() {
    updateContextMenu();
    setTimeout(updateTimer, 60000 - (Date.now() % 60000));
  };
  updateTimer();
});
