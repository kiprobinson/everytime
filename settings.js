'use strict';

document.addEventListener("DOMContentLoaded", function(event) { 
  const ipc = require('electron').ipcRenderer;
  const moment = require('moment-timezone');
  
  let config = null;
  
  //shortcuts...
  const el = (q) => document.querySelector(q);
  const els = (q) => document.querySelectorAll(q);
  
  let updateUi = function() {
    el('#timeFormat_12').checked = (config.timeFormat === 12);
    el('#timeFormat_24').checked = (config.timeFormat === 24);
    
    el('#offsetDisplay_utc').checked   = (config.offsetDisplay === 'utc');
    el('#offsetDisplay_local').checked = (config.offsetDisplay === 'local');
    el('#offsetDisplay_both').checked  = (config.offsetDisplay === 'both');
    el('#offsetDisplay_none').checked  = (config.offsetDisplay === 'none');
    
    //TODO: draw timezones table
    //add listener on label input
    //add listener on remove button
  };
  
  let updateConfig = function() {
    config.timeFormat = Number(el('input[name=timeFormat]:checked').value);
    config.offsetDisplay = el('input[name=offsetDisplay]:checked').value;
    ipc.send('config-updated', config);
  }
  
  let handleAddTimezone = function() {
    let tzName = el('#addTimeZone').value;
    
    //user selected the blank entry--do nothing
    if(tzName === '')
      return;
    
    //this time zone is already selected, don't re-add it
    if(config.timezones.findIndex(tz => tz.code === tzName) < 0) {
      ipc.send('debug-message', `Adding time zone ${tzName}`);
      config.timezones.push({code:tzName, label:''});
      updateConfig();
    }
    else {
      ipc.send('debug-message', `Already have time zone ${tzName}`);
    }
    
    //reset selection back to empty option
    el('#addTimeZone').value = '';
  };
  
  //initialize listeners
  els('input[name=timeFormat], input[name=offsetDisplay]').forEach(e => e.addEventListener('input', updateConfig));
  el('#addTimeZone').addEventListener('input', handleAddTimezone);
  
  ipc.on('send-config', (event, _config) => {
    config = _config;
    updateUi();
  });
  
  //initialize the list of time zones
  (function() {
    let now = moment();
    let janDate = moment((new Date()).setMonth(1));
    let julDate = moment((new Date()).setMonth(7));
    
    let zones = moment.tz.names()
      .filter(tz => tz.match(/^(((Africa|America|Antarctica|Asia|Australia|Europe|Arctic|Atlantic|Indian|Pacific)\/.+)|(UTC))$/))
      .map(tz => ({ code: tz, offset: now.tz(tz).utcOffset() }));
    
    zones.sort((a,b) => (a.offset - b.offset) || a.code.localeCompare(b.code));
    
    let selectBox = el('#addTimeZone');
    zones.forEach(function(tz) {
      let opt = document.createElement('option');
      let offset = now.tz(tz.code).format('ZZ');
      opt.appendChild(document.createTextNode(`${tz.code} (UTC${offset})`));
      opt.value = tz.code;
      selectBox.appendChild(opt)
    });
    
  })();
});
