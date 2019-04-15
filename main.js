'use strict';

//to run from node: npm run start
//to generate exe:  npm run package

const {app, Tray, Menu, BrowserWindow} = require('electron');
const fs = require('fs');
const ipc = require('electron').ipcMain;
const moment = require('moment-timezone');
const path = require('path');
const url = require('url');
const config = require('./config');



const iconPath = path.join(__dirname, 'icons/tray-icon-invert.ico');


let tray = null;
let win = null;
let ts = moment();
let settingsWin = null;

/*

TODO:

Finish Settings dialog for adding/removing time zones and editing labels.
Settings dialog - if opened, closed, and re-opened, get an error. (First window is destroyed I think. Try to make closing it just hide it.)
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
		let tz = (i < 0 ? { code: localTz, label: 'Local Time' } : config.timezones[i]);
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
	template.push({label: 'Settings...', click: showSettings})
	template.push({label: 'Quit', role: 'quit' });
	tray.setContextMenu(Menu.buildFromTemplate(template));
}

function showSettings() {
	if(settingsWin === null) {
		settingsWin = new BrowserWindow({
			width: 800,
			height: 600,
			title: 'Everytime Settings',
			show: false,
			//backgroundColor: '#2e2c29',
			icon: path.join(__dirname, 'icons/app-icon.ico'),
		});
		settingsWin.setMenu(null);
		
		settingsWin.loadURL(url.format({
			pathname: path.join(__dirname, 'settings.html'),
			protocol: 'file:',
			slashes: true
		}));
	  settingsWin.webContents.on('did-finish-load', () => {
	    settingsWin.show();
	    settingsWin.webContents.send('send-config', config);
	  });
	}
  else {
  	settingsWin.show();
  	settingsWin.webContents.send('send-config', config);
  }
}

app.on('ready', function(){
	win = new BrowserWindow({show: false});
	tray = new Tray(iconPath);
	
	config.loadConfig();
	
	ipc.on('config-updated', function(e, _config) {
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
