'use strict';

const ipc = require('electron').ipcRenderer;
const moment = require('moment-timezone');
const template = require('./template');
const {utils} = require('./utils');

const timezoneOptionTemplate = `
  <option value="{{code}}">{{code}} (UTC{{offset}})</option>
`;

const resultTemplate = `
  <div class="row">
    <div class="label">{{label}}</div>
    <div class="value">{{timeDisplay}}</div>
  </div>
`;

document.addEventListener('DOMContentLoaded', function() {
  let config = null;
  
  //shortcuts...
  const el = (q => document.querySelector(q));
  const els = (q => document.querySelectorAll(q));
  
  function updateResults() {
    const ts = moment.tz(el('#planning_date').value + 'T' + el('#planning_time').value, el('#planning_timezone').value);
    let results = '';
    
    for(let i = -1; i < config.timezones.length; i++) {
      const tz = (i < 0 ? {code: moment.tz.guess(true), label: 'Local Time'} : config.timezones[i]);
      const formatted = utils.formatTimestamp(ts, tz, config);
      const diffDay = (formatted.dayDiff < 0 ? ' (-1 day)' : (formatted.dayDiff > 0 ? ' (+1 day)' : ''));
      results += template.renderTemplate(resultTemplate, {label: formatted.label, timeDisplay: `${formatted.tzTime}${diffDay}`});
    }
    
    el('#planning_results').innerHTML = results;
  }
  
  //initialize listeners
  els('#planning_date, #planning_time, #planning_timezone').forEach(e => e.addEventListener('input', updateResults));
  
  ipc.on('send-config', function(event, _config) {
    config = _config;
    updateResults();
  });
  
  ipc.on('before-show', function() {
    //set date and time to now
    el('#planning_date').value = moment().format('YYYY-MM-DD');
    el('#planning_time').value = moment().format('HH:mm');
    el('#planning_timezone').value = moment.tz.guess(true);
    updateResults();
  });
  
  //initialize the list of time zones
  (function() {
    const now = moment();
    const zones = utils.listAllZones();
    
    const selectBox = el('#planning_timezone');
    zones.forEach(function(tz) {
      selectBox.innerHTML += template.renderTemplate(timezoneOptionTemplate, {code: tz.code, offset: now.tz(tz.code).format('ZZ')});
    });
  })();
});
