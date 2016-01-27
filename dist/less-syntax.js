'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lessStringify = require('./less-stringify');

var _lessStringify2 = _interopRequireDefault(_lessStringify);

var _lessParse = require('./less-parse');

var _lessParse2 = _interopRequireDefault(_lessParse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { parse: _lessParse2.default, stringify: _lessStringify2.default };