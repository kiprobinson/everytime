//to run from node: npm run start
//to generate exe:  npm run package

const {app, Tray, Menu, BrowserWindow} = require('electron');
const path = require('path');
const moment = require('moment-timezone');
const fs = require('fs');


const iconPath = path.join(__dirname, 'icons/tray-icon-invert.ico');
const configPath = app.getPath('userData') + '/config.json';

let tray = null;
let win = null;
let ts = moment();
let config = {};

/*

TODO:

Settings Dialog
* Add/remove time zones
* Show timezone offset relative to: UTC, Local, Both
* Time format: 24-hr, 12-hr (am/pm)

When options are updated, re-draw context menu, but don't call SetTimeout()  (add new option to schedule update but default to false)

*/


function loadConfig() {
	let rawConfigJson = '';
	let rawConfig = {};
	
	try {
		rawConfigJson = fs.readFileSync(configPath).toString();
		rawConfig = JSON.parse(rawConfigJson);
	}
	catch(e) {} //don't care
	
	
	let cleanConfig = {
		timeFormat: 24, //either 12 or 24
		offsetDisplay: 'utc', //one of: utc, local, both
		timezones: [],
	};
	
	if(rawConfig.timeFormat === 12 || rawConfig.timeFormat === 24)
		cleanConfig.timeFormat = rawConfig.timeFormat;
	if(['utc','local','both','none'].indexOf(rawConfig.offsetDisplay) >= 0)
		cleanConfig.offsetDisplay = rawConfig.offsetDisplay;
	
	if(Array.isArray(rawConfig.timezones)) {
		let tzNames = new Set();
		for(let i = 0; i < rawConfig.timezones.length; i++) {
			let rawTz = rawConfig.timezones[i];
			if(!rawTz.code || 'string' !== typeof rawTz.code)
				continue;
			let zone = moment.tz.zone(rawTz.code);
			if(zone === null || tzNames.has(zone.name))
				continue;
			
			let cleanTz = {
				code: zone.name,
				label: (('string' === typeof rawTz.label) ? rawTz.label : zone.name)
			}
			
			tzNames.add(cleanTz.name);
			cleanConfig.timezones.push(cleanTz);
		}
	}
	
	if(cleanConfig.timezones.length === 0)
		cleanConfig.timezones.push({code: 'UTC', label: 'UTC'});
	
	config = cleanConfig;
	sortTimeZones();
	saveConfig();
};

function sortTimeZones() {
	let janDate = moment((new Date()).setMonth(1));
	let julDate = moment((new Date()).setMonth(7));
	
	let avgOffsets = {};
	
	config.timezones.sort(function(a,b) {
		if(!avgOffsets[a.code])
			avgOffsets[a.code] = (janDate.tz(a.code).utcOffset() + julDate.tz(a.code).utcOffset())/2;
		if(!avgOffsets[b.code])
			avgOffsets[b.code] = (janDate.tz(b.code).utcOffset() + julDate.tz(b.code).utcOffset())/2;
		
		return avgOffsets[a.code] - avgOffsets[b.code];
	});
};

function saveConfig() {
	let rawConfigJson = '';
	
	try {
		rawConfigJson = fs.readFileSync(configPath).toString();
	}
	catch(e) {} //don't care
	
	let cleanConfigJson = JSON.stringify(config, null, 2);
	if(cleanConfigJson !== rawConfigJson)
		fs.writeFileSync(configPath, cleanConfigJson);
};

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
	
	const timeFormat = (config.timeFormat === 24 ? 'HH:mm' : 'hh:mm a');
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
		let tzTime = ts.tz(tz.code).format('HH:mm');
		
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
		
		//let label = `${tz.label} (UTC${offset}, Local${offsetVsLocal}): ${tzTime}${diffDay}`
		//let label = `${tz.label} (UTC${offset}, Local${offsetVsLocal}): ${tzTime}${diffDay}`
		template.push({label: `${tz.label}${offsetDisplay}`, sublabel: `${tzTime}${diffDay}`});
		if(i < 0)
			template.push({type: 'separator'});
	}
	
	template.push({type: 'separator'});
	template.push({label: 'Quit', role: 'quit' });
	tray.setContextMenu(Menu.buildFromTemplate(template));
}

app.on('ready', function(){
	win = new BrowserWindow({show: false});
	tray = new Tray(iconPath);
	
	loadConfig();
	
	//function runs at the start of every minute to update menu
	let updateTimer = function() {
		updateContextMenu();
		setTimeout(updateTimer, 60000 - (Date.now() % 60000));
	};
	updateTimer();
	//tray.setToolTip('This is my application.\n\nNewline!');
	
	
	//tray.on('click', () => tray.popUpContextMenu());
	
});
