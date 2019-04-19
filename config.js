'use strict';

const {app} = require('electron');
const fs = require('fs');
const moment = require('moment-timezone');
const AutoLaunch = require('auto-launch');

const configPath = app.getPath('userData') + '/config.json';
const autoLaunch = process.execPath.match(/node_modules/) ? null : new AutoLaunch({name: 'Everytime', path: process.execPath});
console.warn('process.execPath' + process.execPath);
if(autoLaunch === null)
  console.warn('AutoLaunch option will be ignored when running as a developer');

const validTimezones = new Set(
  moment.tz.names()
    .filter(tz => tz.match(/^(((Africa|America|Antarctica|Asia|Australia|Europe|Arctic|Atlantic|Indian|Pacific)\/.+)|(UTC))$/))
);

exports.autoLaunch = false;
exports.timeFormat = 12;
exports.offsetDisplay = 'utc';
exports.timezones = [{code: 'UTC', label: 'UTC'}];

exports.loadConfig = function() {
  let rawConfigJson = '';
  let rawConfig = {};
  
  try {
    rawConfigJson = fs.readFileSync(configPath).toString();
    rawConfig = JSON.parse(rawConfigJson);
  }
  catch(e) {} //don't care
  
  exports.autoLaunch = rawConfig.autoLaunch;
  exports.timeFormat = rawConfig.timeFormat;
  exports.offsetDisplay = rawConfig.offsetDisplay;
  exports.timezones = rawConfig.timezones;
  
  exports.saveConfig();
};

function sanitizeConfig() {
  let cleanConfig = {
    autoLaunch: false,
    timeFormat: 12, //either 12 or 24
    offsetDisplay: 'utc', //one of: utc, local, both
    timezones: [],
  };
  
  if(exports.autoLaunch === true)
    cleanConfig.autoLaunch = true;
  if(exports.timeFormat === 12 || exports.timeFormat === 24)
    cleanConfig.timeFormat = exports.timeFormat;
  if(['utc', 'local', 'both', 'none'].indexOf(exports.offsetDisplay) >= 0)
    cleanConfig.offsetDisplay = exports.offsetDisplay;
  
  if(Array.isArray(exports.timezones)) {
    let tzNames = new Set();
    for(let i = 0; i < exports.timezones.length; i++) {
      let rawTz = exports.timezones[i];
      if(!rawTz.code || 'string' !== typeof rawTz.code)
        continue;
      
      let zone = moment.tz.zone(rawTz.code);
      if(zone === null || tzNames.has(zone.name) || !validTimezones.has(zone.name))
        continue;
      
      let cleanTz = {
        code: zone.name,
        label: (('string' === typeof rawTz.label) ? rawTz.label : ''),
      };
      
      tzNames.add(cleanTz.name);
      cleanConfig.timezones.push(cleanTz);
    }
  }
  
  //if we don't have any timezones, at least show UTC
  if(cleanConfig.timezones.length === 0)
    cleanConfig.timezones.push({code: 'UTC', label: 'UTC'});
  
  exports.autoLaunch = cleanConfig.autoLaunch;
  exports.timeFormat = cleanConfig.timeFormat;
  exports.offsetDisplay = cleanConfig.offsetDisplay;
  exports.timezones = cleanConfig.timezones;
  
  sortTimeZones();
}

function sortTimeZones() {
  let janDate = moment((new Date()).setMonth(1));
  let julDate = moment((new Date()).setMonth(7));
  
  let avgOffsets = {};
  
  exports.timezones.sort(function(a, b) {
    if(avgOffsets[a.code] === undefined)
      avgOffsets[a.code] = (janDate.tz(a.code).utcOffset() + julDate.tz(a.code).utcOffset())/2;
    if(avgOffsets[b.code] === undefined)
      avgOffsets[b.code] = (janDate.tz(b.code).utcOffset() + julDate.tz(b.code).utcOffset())/2;
    
    return avgOffsets[a.code] - avgOffsets[b.code];
  });
}

exports.saveConfig = function() {
  sanitizeConfig();
  
  let rawConfigJson = '';
  
  try {
    rawConfigJson = fs.readFileSync(configPath).toString();
  }
  catch(e) {} //don't care
  
  let cleanConfig = {
    autoLaunch: exports.autoLaunch,
    timeFormat: exports.timeFormat,
    offsetDisplay: exports.offsetDisplay,
    timezones: exports.timezones,
  };
  
  let cleanConfigJson = JSON.stringify(cleanConfig, null, 2);
  if(cleanConfigJson !== rawConfigJson)
    fs.writeFileSync(configPath, cleanConfigJson);
  
  if(autoLaunch !== null) {
    if(exports.autoLaunch)
      autoLaunch.enable();
    else
      autoLaunch.disable();
  }
};

exports.loadConfig();
