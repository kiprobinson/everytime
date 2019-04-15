'use strict';



/**
 * A very very simple templating engine. Mimics basic funcionality of Handlebars templates.
 * @param template Template content
 * @param params   Object where keys are strings to be searched, and values are replacements to make.
 *                 This may contain nested objects.
 * @params prefix  Only used when recursing.
 */
exports.renderTemplate = function(template, params, prefix) {
  prefix = prefix || '';
  
  Object.keys(params).forEach(function(k) {
    let v = params[k];
    if('object' === typeof v)
      template = renderTemplate(template, v, k + '.');
    else
      template = template.replace(new RegExp('\\{\\{' + regexQuote(prefix + k) + '\\}\\}', 'g'), escapeHtml(v));
  });
  
  //if this was not recursive call, clean up any unused template strings
  if(prefix=='')
    template = template.replace(/\{\{(.*?)\}\}/g, '');//'MISSING: [$1]');
  
  return template;
}

/**
 * Escapes any characters which are special characters in a regular expression.
 */
function regexQuote(str) {
  return str.replace(/([\.\\\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:\-])/g, '\\$1');
}

function escapeHtml(str) {
  if('string' !== typeof str)
    str = String(str);
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return str.replace(/[&<>"']/g, m => map[m]);
}
