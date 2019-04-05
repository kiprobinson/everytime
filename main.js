//to run:   electron . 
//to generate exe:  electron-packager . everytime --platform=win32 --arch=x64 --overwrite

const {app, Tray, Menu, BrowserWindow} = require('electron');
const path = require('path');
const moment = require('moment-timezone');

const iconPath = path.join(__dirname, 'icons/tray-icon-invert.ico');
let tray = null;
let win = null;
let ts = moment();

/*

TODO:

Store config in:  app.getPath('userData') + '/config.json'

Settings Dialog
* Add/remove time zones
* Show timezone offset relative to: UTC, Local, Both
* Time format: 24-hr, 12-hr (am/pm)

When options are updated, re-draw context menu, but don't call SetTimeout()  (add new option to schedule update but default to false)

Sort time zones by average offset (average of jan 1 and jul 1 offset)

*/

const allTz = [
	{ code: 'America/Los_Angeles', label: 'West Coast' },
	{ code: 'America/New_York', label: 'East Coast' },
	{ code: 'UTC', label: 'UTC' },
	{ code: 'Europe/London', label: 'UK' },
	{ code: 'Europe/Helsinki', label: 'Finland' },
	{ code: 'Asia/Kolkata', label: 'India' },
	{ code: 'Asia/Tokyo', label: 'Tokyo' },
	{ code: 'Australia/Sydney', label: 'Australia' },
];


app.on('ready', function(){
	win = new BrowserWindow({show: false});
	tray = new Tray(iconPath);
	
	let formatOffsetMins = function(offsetMins) {
		let sign = (offsetMins < 0 ? '-' : '+');
		let hrs = Math.floor(Math.abs(offsetMins) / 60);
		hrs = (hrs < 10 ? '0' : '') + String(hrs);
		let mins = Math.abs(offsetMins) % 60;
		mins = (mins < 10 ? '0' : '') + String(mins);
		return sign + hrs + mins;
	};
	
	let updateContextMenu = function() {
		let ts = moment();
		
		let template = [];
		//let tooltip = '';
		
		let localTz = moment.tz.guess(true);
		let localDate = Number(ts.tz(localTz).format('YYYYMMDD'));
		//let localOffsetMins = ts.tz(localTz).utcOffset();
		
		//start with i=-1, which indicates local time zone which is always drawn at the top with a separator.
		for(let i = -1; i < allTz.length; i++) {
			let tz = (i < 0 ? { code: localTz, label: 'Local Time' } : allTz[i]);
			let offset = ts.tz(tz.code).format('ZZ');
			//let offsetMins = ts.tz(tz.code).utcOffset();
			let tzDate = Number(ts.tz(tz.code).format('YYYYMMDD'));
			let diffDay = (tzDate < localDate ? ' (yesterday)' : (tzDate > localDate ? ' (tomorrow)' : ''));
			let tzTime = ts.tz(tz.code).format('HH:mm');
			
			//let offsetVsLocal = formatOffsetMins(offsetMins - localOffsetMins);
			
			//let label = `${tz.label} (UTC${offset}, Local${offsetVsLocal}): ${tzTime}${diffDay}`
			template.push({label: `${tz.label} (UTC${offset})`, sublabel: `${tzTime}${diffDay}`});
			if(i < 0)
				template.push({type: 'separator'});
			//tooltip += `${tz.label} (UTC${offset}): ${tzTime}${diffDay}\n`;
		}
		
		template.push({type: 'separator'});
		template.push({label: 'Quit', role: 'quit' });
		tray.setContextMenu(Menu.buildFromTemplate(template));
		//tray.setToolTip(tooltip);
		
		setTimeout(updateContextMenu, 60000 - (Date.now() % 60000));
	};
	
	updateContextMenu();
	//tray.setToolTip('This is my application.\n\nNewline!');
	
	
	//tray.on('click', () => tray.popUpContextMenu());
	
});
