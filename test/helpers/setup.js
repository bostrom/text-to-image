'use strict';

var chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiThings = require('chai-things'),
  sinonChai = require("sinon-chai");

global.sinon = require('sinon');
global.expect = chai.expect;
global.should = chai.should();
global.assert = chai.assert;
chai.use(chaiAsPromised);
chai.use(chaiThings);
chai.use(sinonChai);
