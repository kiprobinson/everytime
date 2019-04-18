'use strict';



/**
 * A very very simple templating engine. Mimics basic funcionality of Handlebars templates.
 * @param template Template content
 * @param params   Object where keys are strings to be searched, and values are replacements to make.
 *                 This may contain nested objects.
 * @params prefix  Only used when recursing.
 */
exports.renderTemplate = function(template, params, prefix='') {
  Object.keys(params).forEach(function(k) {
    let v = params[k];
    if('object' === typeof v)
      template = exports.renderTemplate(template, v, k + '.');
    else
      template = template.replace(new RegExp('\\{\\{' + regexQuote(prefix + k) + '\\}\\}', 'g'), escapeHtml(v));
  });
  
  //if this was not recursive call, clean up any unused template strings
  if(prefix==='')
    template = template.replace(/\{\{(.*?)\}\}/g, '');//'MISSING: [$1]');
  
  return template;
};

/**
 * Escapes any characters which are special characters in a regular expression.
 */
function regexQuote(s) {
  return s.replace(/([\.\\\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:\-])/g, '\\$1');
}

function escapeHtml(s) {
  if('string' !== typeof s)
    s = String(s);
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return s.replace(/[&<>"']/g, m => map[m]);
}
