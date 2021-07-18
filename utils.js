'use strict';

const moment = require('moment-timezone');

const utils = {
  
  /**
   * Formats offset minutes like "+0530", "-0800", etc.
   * @param offsetMins {Number}
   */
  formatOffsetMins(offsetMins) {
    let sign = (offsetMins < 0 ? '-' : '+');
    let hrs = Math.floor(Math.abs(offsetMins) / 60).toString().padStart(2, '0');
    let mins = (Math.abs(offsetMins) % 60).toString().padStart(2, '0');
    return sign + hrs + mins;
  },
  
  
  /**
   * Formats a timestamp in the given time zone.
   * @param ts A moment instance
   * @param tz Name of the time zone to display the timestamp in.
   * @param config Config object
   * 
   * @returns {
   *   label: string    The label for this time zone, configured as per configs
   *   tzTime: string   The time in the given timezone, formatted as per configs
   *   dayDiff: number  If the formatted timestamp is in a different day than in local time zone, this indicates how many days different it is.
   * }
   */
  formatTimestamp(ts, tz, config) {
    const ret = {
      label: '',
      tzTime: '', //time in the timezone
      dayDiff: 0, //number of days different from local indicating day difference from local
    };
    
    const timeFormat = (config.timeFormat === 24 ? 'HH:mm' : 'h:mm A');
    const showUtcOffset = (config.offsetDisplay === 'both' || config.offsetDisplay === 'utc');
    const showLocalOffset = (config.offsetDisplay === 'both' || config.offsetDisplay === 'local');
    
    const localTz = ts.tz() || moment.tz.guess(true);
    const localTs = ts.clone().tz(localTz);
    const localDate = localTs.format('YYYYMMDD');
    const localOffsetMins = localTs.utcOffset();
    
    const altTs = ts.clone().tz(tz.code);
    const offsetMins = altTs.utcOffset();
    const tzDate = altTs.format('YYYYMMDD');
    
    ret.dayDiff = moment(tzDate, 'YYYYMMDD').diff(moment(localDate, 'YYYYMMDD'), 'days');
    ret.tzTime = altTs.format(timeFormat);
    
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
  
  /**
   * Lists all valid time zones.
   * @returns array of objects 
   */
  listAllZones() {
    const now = moment();
    
    const zones = moment.tz.names()
      .filter(tz => tz.match(/^(((Africa|America|Antarctica|Asia|Australia|Europe|Arctic|Atlantic|Indian|Pacific)\/.+)|(UTC))$/))
      .map(tz => ({code: tz, offset: now.tz(tz).utcOffset()}));
    
    zones.sort((a, b) => (a.offset - b.offset) || a.code.localeCompare(b.code));
    return zones;
  },
  
  /**
   * Sorts timezones by their offsets
   */
  sortTimeZones(tzList) {
    let janDate = moment((new Date()).setMonth(1));
    let julDate = moment((new Date()).setMonth(7));
    
    let avgOffsets = {};
    
    tzList.sort(function(a, b) {
      if(avgOffsets[a.code] === undefined)
        avgOffsets[a.code] = (janDate.tz(a.code).utcOffset() + julDate.tz(a.code).utcOffset())/2;
      if(avgOffsets[b.code] === undefined)
        avgOffsets[b.code] = (janDate.tz(b.code).utcOffset() + julDate.tz(b.code).utcOffset())/2;
      
      return avgOffsets[a.code] - avgOffsets[b.code] || a.code.localeCompare(b.code);
    });
    
    return tzList;
  },
};

exports.utils = utils;
