'use strict';

var Web3 = require('web3');

function ContractWrapper (headers, web3) {
  if (!web3) {
    throw new Error('Must supply a Web3 connection!');
  }

  this.headers = headers;
  this._class = web3.eth.contract(headers.interface);
}

ContractWrapper.prototype.deploy = function () {
  var args = new Array(arguments);
  args[args.length - 1].data = this.headers.bytecode;
  return this._class.new.apply(this._class, args);
};

// Wrap pass-through functions by name.
var passthroughs = ['at', 'new'];
for (var i = 0; i < passthroughs.length; i += 1) {
  ContractWrapper.prototype[passthroughs[i]] = function () {
    return this._class[passthroughs[i]].apply(this._class, arguments);
  };
}

module.exports = function (env, web3) {
  if (typeof env === 'undefined') {
    env = {};
  }

  if (typeof web3 === 'undefined') {
    if (!env.rpcURL) {
      throw new Error('Need either a Web3 instance or an RPC URL!');
    }
    web3 = new Web3(new Web3.providers.HttpProvider(env.rpcURL));
  }

  var header = {
    'contracts': {},
    'version': {}
  };
  this.headers = header;

  this.classes = {};
  for (var key in header) {
    this.headers[key].interface = JSON.parse(this.headers[key].interface);
    this.classes[key] = new ContractWrapper(header[key], web3);
  }

  this.objects = {};
  for (var i in env.objects) {
    var obj = env.objects[i];
    this.objects[i] = this.classes[obj['class']].at(obj.address);
  }
};
