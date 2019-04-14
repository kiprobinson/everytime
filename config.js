'use strict';

const {app, Tray, Menu, BrowserWindow} = require('electron');
const fs = require('fs');
const moment = require('moment-timezone');
const path = require('path');
const url = require('url');

const configPath = app.getPath('userData') + '/config.json';

const validTimezones = new Set(
  moment.tz.names()
  .filter(tz => tz.match(/^(((Africa|America|Antarctica|Asia|Australia|Europe|Arctic|Atlantic|Indian|Pacific)\/.+)|(UTC))$/))
);

exports.timeFormat = 12;
exports.offsetDisplay = 'utc';
exports.timezones = [{code: 'UTC', label: 'UTC'}];

exports.loadConfig = function() {
  console.log('called loadConfig()');
  
  let rawConfigJson = '';
  let rawConfig = {};
  
  try {
    rawConfigJson = fs.readFileSync(configPath).toString();
    rawConfig = JSON.parse(rawConfigJson);
  }
  catch(e) {} //don't care
  
  
  exports.timeFormat = rawConfig.timeFormat;
  exports.offsetDisplay = rawConfig.offsetDisplay;
  exports.timezones = rawConfig.timezones;
  
  exports.saveConfig();
};

function sanitizeConfig() {
  let cleanConfig = {
    timeFormat: 12, //either 12 or 24
    offsetDisplay: 'utc', //one of: utc, local, both
    timezones: [],
  };
  
  if(exports.timeFormat === 12 || exports.timeFormat === 24)
    cleanConfig.timeFormat = exports.timeFormat;
  if(['utc','local','both','none'].indexOf(exports.offsetDisplay) >= 0)
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
        label: (('string' === typeof rawTz.label) ? rawTz.label : '')
      }
      
      tzNames.add(cleanTz.name);
      cleanConfig.timezones.push(cleanTz);
    }
  }
  
  //if we don't have any timezones, at least show UTC
  if(cleanConfig.timezones.length === 0)
    cleanConfig.timezones.push({code: 'UTC', label: 'UTC'});
  
  exports.timeFormat = cleanConfig.timeFormat;
  exports.offsetDisplay = cleanConfig.offsetDisplay;
  exports.timezones = cleanConfig.timezones;
  
  sortTimeZones();
}

function sortTimeZones() {
  let janDate = moment((new Date()).setMonth(1));
  let julDate = moment((new Date()).setMonth(7));
  
  let avgOffsets = {};
  
  exports.timezones.sort(function(a,b) {
    if(avgOffsets[a.code] === undefined)
      avgOffsets[a.code] = (janDate.tz(a.code).utcOffset() + julDate.tz(a.code).utcOffset())/2;
    if(avgOffsets[b.code] === undefined)
      avgOffsets[b.code] = (janDate.tz(b.code).utcOffset() + julDate.tz(b.code).utcOffset())/2;
    
    return avgOffsets[a.code] - avgOffsets[b.code];
  });
};

exports.saveConfig = function() {
  sanitizeConfig();
  
  let rawConfigJson = '';
  
  try {
    rawConfigJson = fs.readFileSync(configPath).toString();
  }
  catch(e) {} //don't care
  
  let cleanConfig = {
    timeFormat: exports.timeFormat,
    offsetDisplay: exports.offsetDisplay,
    timezones: exports.timezones,
  };
  
  let cleanConfigJson = JSON.stringify(cleanConfig, null, 2);
  if(cleanConfigJson !== rawConfigJson) {
    console.log('saving config');
    fs.writeFileSync(configPath, cleanConfigJson);
  }
  else {
    console.log('no changes to save');
  }
};

exports.loadConfig();
