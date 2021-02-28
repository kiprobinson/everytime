'use strict';

const moment = require('moment-timezone');

const utils = {
  formatOffsetMins(offsetMins) {
    let sign = (offsetMins < 0 ? '-' : '+');
    let hrs = Math.floor(Math.abs(offsetMins) / 60).toString().padStart(2, '0');
    let mins = (Math.abs(offsetMins) % 60).toString().padStart(2, '0');
    return sign + hrs + mins;
  },
  
  
  //ts: moment instance
  //tz: {code:string, label:string}
  //config
  formatTimestamp(ts, tz, config) {
    const ret = {
      label: '',
      tzTime: '', //time in the timezone
      dayDiff: 0, //-1, 0, or +1, indicating day difference from local
    };
    
    const timeFormat = (config.timeFormat === 24 ? 'HH:mm' : 'h:mm A');
    const showUtcOffset = (config.offsetDisplay === 'both' || config.offsetDisplay === 'utc');
    const showLocalOffset = (config.offsetDisplay === 'both' || config.offsetDisplay === 'local');
    
    const localTz = moment.tz.guess(true);
    const localDate = Number(ts.tz(localTz).format('YYYYMMDD'));
    const localOffsetMins = ts.tz(localTz).utcOffset();
    
    const offsetMins = ts.tz(tz.code).utcOffset();
    const tzDate = Number(ts.tz(tz.code).format('YYYYMMDD'));
    ret.dayDiff = (tzDate < localDate ? -1 : (tzDate > localDate ? 1 : 0));
    ret.tzTime = ts.tz(tz.code).format(timeFormat);
    
    const offsetVsUtc = utils.formatOffsetMins(offsetMins);
    const offsetVsLocal = utils.formatOffsetMins(offsetMins - localOffsetMins);
    
    const offsetDisplays = [];
    if(showUtcOffset)
      offsetDisplays.push(`UTC${offsetVsUtc}`);
    if(showLocalOffset)
      offsetDisplays.push(`Local${offsetVsLocal}`);
    
    const offsetDisplay = offsetDisplays.length ? ` (${offsetDisplays.join(', ')})` : '';
    
    const labelDisplay = (tz.label === '' ? tz.code : tz.label);
    
    ret.label = `${labelDisplay}${offsetDisplay}`;
    
    return ret;
  },
  
  listAllZones() {
    const now = moment();
    
    const zones = moment.tz.names()
      .filter(tz => tz.match(/^(((Africa|America|Antarctica|Asia|Australia|Europe|Arctic|Atlantic|Indian|Pacific)\/.+)|(UTC))$/))
      .map(tz => ({code: tz, offset: now.tz(tz).utcOffset()}));
    
    zones.sort((a, b) => (a.offset - b.offset) || a.code.localeCompare(b.code));
    return zones;
  },
};

exports.utils = utils;
