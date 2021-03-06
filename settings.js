'use strict';

const ipc = require('electron').ipcRenderer;
const moment = require('moment-timezone');
const template = require('./template');
const {utils} = require('./utils');

const timezoneOptionTemplate = `
  <option value="{{code}}">{{code}} (UTC{{offset}})</option>
`;

const timezoneAddRowTemplate = `
  <tr class="timezoneRow">
    <td class="timezoneName">{{code}}</td>
    <td><input type="text" class="timezoneLabel" value="{{label}}" placeholder="Enter a label for this timezone (optional)." data-timezone-name="{{code}}" /></td>
    <td><button class="removeTimezone" data-timezone-name="{{code}}">Remove</button></td>
  </tr>
`;

document.addEventListener('DOMContentLoaded', function() {
  let config = null;
  
  //shortcuts...
  const el = (q => document.querySelector(q));
  const els = (q => document.querySelectorAll(q));
  
  function updateUi() {
    el('#autoLaunch').checked = (config.autoLaunch === true);
    
    el('#timeFormat_12').checked = (config.timeFormat === 12);
    el('#timeFormat_24').checked = (config.timeFormat === 24);
    
    el('#offsetDisplay_utc').checked   = (config.offsetDisplay === 'utc');
    el('#offsetDisplay_local').checked = (config.offsetDisplay === 'local');
    el('#offsetDisplay_both').checked  = (config.offsetDisplay === 'both');
    el('#offsetDisplay_none').checked  = (config.offsetDisplay === 'none');
    
    //draw timezone table only if number of rows has changed
    let tbody = el('#timezoneTable tbody');
    if(tbody.childElementCount !== (config.timezones.length + 1)) {
      els('#timezoneTable .timezoneRow').forEach(e => e.remove());
      
      tbody.innerHTML += config.timezones.reduce(((s, tz) => s + template.renderTemplate(timezoneAddRowTemplate, tz)), '');
      
      //add listener on label input
      els('#timezoneTable .timezoneRow .timezoneLabel').forEach(function(input) {
        input.addEventListener('input', function(e) {
          let code = e.target.dataset.timezoneName;
          let label = e.target.value;
          let idx = config.timezones.findIndex(tz => tz.code === code);
          if(idx >= 0) {
            config.timezones[idx].label = label;
            updateConfig();
          }
        });
      });
      
      //add listener on remove button
      els('#timezoneTable .timezoneRow .removeTimezone').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          let code = e.target.dataset.timezoneName;
          config.timezones = config.timezones.filter(tz => tz.code !== code);
          updateConfig();
          updateUi();
        });
      });
    }
  }
  
  function updateConfig() {
    config.autoLaunch = el('#autoLaunch').checked;
    config.timeFormat = Number(el('input[name=timeFormat]:checked').value);
    config.offsetDisplay = el('input[name=offsetDisplay]:checked').value;
    ipc.send('config-updated', config);
  }
  
  function handleAddTimezone() {
    let tzName = el('#addTimeZone').value;
    
    //user selected the blank entry--do nothing
    if(tzName === '')
      return;
    
    //this time zone is already selected, don't re-add it
    if(config.timezones.findIndex(tz => tz.code === tzName) < 0) {
      config.timezones.push({code: tzName, label: ''});
      updateConfig();
    }
    
    //reset selection back to empty option
    el('#addTimeZone').value = '';
    updateUi();
  }
  
  //initialize listeners
  els('#autoLaunch, input[name=timeFormat], input[name=offsetDisplay]').forEach(e => e.addEventListener('input', updateConfig));
  el('#addTimeZone').addEventListener('input', handleAddTimezone);
  
  ipc.on('send-config', function(event, _config) {
    config = _config;
    updateUi();
  });
  
  //initialize the list of time zones
  (function() {
    const now = moment();
    const zones = utils.listAllZones();
    
    const selectBox = el('#addTimeZone');
    zones.forEach(function(tz) {
      selectBox.innerHTML += template.renderTemplate(timezoneOptionTemplate, {code: tz.code, offset: now.tz(tz.code).format('ZZ')});
    });
  })();
});
