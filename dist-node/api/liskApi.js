'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _config = require('../../config.json');

var _config2 = _interopRequireDefault(_config);

var _constants = require('../constants');

var _privateApi = require('./privateApi');

var privateApi = _interopRequireWildcard(_privateApi);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
*
* @class LiskAPI
* @param {Object} options - Initialization Object for the LiskAPI instance.
 */

/*
 * Copyright © 2017 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */

/**
 * LiskAPI module provides functions for interfacing with the Lisk network.
 * Providing mechanisms for:
 *
 * - Retrieval of blockchain data: accounts, blocks, transactions.
 * - Enhancing Lisk security by local signing of transactions and immediate network transmission.
 * - Connecting to Lisk nodes or to localhost instance of Lisk core.
 * - Configurable network settings to work in different Lisk environments.
 *
 *     var lisk = require('lisk-js');
 *
 *     var options = {
 *         ssl: false,
 *         node: '',
 *         randomNode: true,
 *         testnet: true,
 *         port: '7000',
 *         bannedNodes: [],
 *         nodes: [],
 *         nethash: ''
 *     };
 *
 *
 *     var LSK = lisk.api(options);
*/
var LiskAPI = function () {
	function LiskAPI(providedOptions) {
		(0, _classCallCheck3.default)(this, LiskAPI);

		var options = (0, _assign2.default)({}, _config2.default.options, providedOptions);

		this.defaultNodes = options.nodes || _config2.default.nodes.mainnet;

		this.defaultSSLNodes = this.defaultNodes;

		this.defaultTestnetNodes = options.nodes || _config2.default.nodes.testnet;

		this.options = options;
		this.ssl = options.ssl;
		this.randomNode = Boolean(options.randomNode);
		this.testnet = options.testnet;
		this.bannedNodes = options.bannedNodes;
		this.node = options.node || privateApi.selectNewNode.call(this);
		this.port = options.port === '' || options.port ? options.port : utils.getDefaultPort(options);
		this.nethash = this.getNethash(options.nethash);
	}

	/**
  * @method getNethash
  * @return {Object}
  * @public
  */

	(0, _createClass3.default)(LiskAPI, [{
		key: 'getNethash',
		value: function getNethash(providedNethash) {
			var port = this.port;

			var NetHash = this.testnet ? utils.netHashOptions({ port: port }).testnet : utils.netHashOptions({ port: port }).mainnet;

			if (providedNethash) {
				NetHash.nethash = providedNethash;
				NetHash.version = '0.0.0a';
			}

			return NetHash;
		}

		/**
   * @method getNodes
   * @return {Object}
   */

	}, {
		key: 'getNodes',
		value: function getNodes() {
			return {
				official: this.defaultNodes.map(function (node) {
					return { node: node };
				}),
				ssl: this.defaultSSLNodes.map(function (node) {
					return { node: node, ssl: true };
				}),
				testnet: this.defaultTestnetNodes.map(function (node) {
					return {
						node: node,
						testnet: true
					};
				})
			};
		}

		/**
   * @method setNode
   * @param {String} node
   * @return {Object}
   */

	}, {
		key: 'setNode',
		value: function setNode(node) {
			this.node = node || privateApi.selectNewNode.call(this);
			return this.node;
		}

		/**
   * @method setTestnet
   * @param {Boolean} testnet
   */

	}, {
		key: 'setTestnet',
		value: function setTestnet(testnet) {
			if (this.testnet !== testnet) {
				this.bannedNodes = [];
			}
			this.testnet = testnet;
			this.port = testnet ? _constants.TEST_PORT : _constants.LIVE_PORT;

			privateApi.selectNewNode.call(this);
		}

		/**
   * @method setSSL
   * @param {Boolean} ssl
   */

	}, {
		key: 'setSSL',
		value: function setSSL(ssl) {
			if (this.ssl !== ssl) {
				this.ssl = ssl;
				this.bannedNodes = [];
				privateApi.selectNewNode.call(this);
			}
		}

		/**
   * @method broadcastSignedTransaction
   * @param transaction
   * @param callback
   *
   * @return {Object}
   */

	}, {
		key: 'broadcastSignedTransaction',
		value: function broadcastSignedTransaction(transaction, callback) {
			var request = {
				requestUrl: utils.getFullURL(this) + '/api/transactions',
				nethash: this.nethash,
				requestParams: { transaction: transaction }
			};

			return privateApi.sendRequestPromise.call(this, _constants.POST, request).then(function (result) {
				return result.body;
			}).then(utils.optionallyCallCallback.bind(null, callback));
		}

		/**
   * @method sendRequest
   * @param requestMethod
   * @param requestType
   * @param optionsOrCallback
   * @param callbackIfOptions
   *
   * @return {Object}
   */

	}, {
		key: 'sendRequest',
		value: function sendRequest(requestMethod, requestType, optionsOrCallback, callbackIfOptions) {
			var callback = callbackIfOptions || optionsOrCallback;
			var options = typeof optionsOrCallback !== 'function' && typeof optionsOrCallback !== 'undefined' ? utils.checkOptions(optionsOrCallback) : {};

			return privateApi.sendRequestPromise.call(this, requestMethod, requestType, options).then(function (result) {
				return result.body;
			}).then(privateApi.handleTimestampIsInFutureFailures.bind(this, requestMethod, requestType, options)).catch(privateApi.handleSendRequestFailures.bind(this, requestMethod, requestType, options)).then(utils.optionallyCallCallback.bind(null, callback));
		}

		/**
   * @method transferLSK
   * @param recipientId
   * @param amount
   * @param secret
   * @param secondSecret
   * @param callback
   *
   * @return {Object}
   */

	}, {
		key: 'transferLSK',
		value: function transferLSK(recipientId, amount, secret, secondSecret, callback) {
			return this.sendRequest(_constants.POST, 'transactions', { recipientId: recipientId, amount: amount, secret: secret, secondSecret: secondSecret }, callback);
		}
	}]);
	return LiskAPI;
}();

/**
 * @method getAccount
 * @param address
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

exports.default = LiskAPI;
LiskAPI.prototype.getAccount = utils.wrapSendRequest(_constants.GET, 'accounts', function (address) {
	return { address: address };
});

/**
 * @method getActiveDelegates
 * @param limit
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getActiveDelegates = utils.wrapSendRequest(_constants.GET, 'delegates', function (limit) {
	return { limit: limit };
});

/**
 * @method getStandbyDelegates
 * @param limit
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getStandbyDelegates = utils.wrapSendRequest(_constants.GET, 'delegates', function (limit, _ref) {
	var _ref$orderBy = _ref.orderBy,
	    orderBy = _ref$orderBy === undefined ? 'rate:asc' : _ref$orderBy,
	    _ref$offset = _ref.offset,
	    offset = _ref$offset === undefined ? 101 : _ref$offset;
	return {
		limit: limit,
		orderBy: orderBy,
		offset: offset
	};
});

/**
 * @method searchDelegatesByUsername
 * @param username
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.searchDelegatesByUsername = utils.wrapSendRequest(_constants.GET, 'delegates', function (search) {
	return { search: search };
});

/**
 * @method getBlocks
 * @param limit
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getBlocks = utils.wrapSendRequest(_constants.GET, 'blocks', function (limit) {
	return {
		limit: limit
	};
});

/**
 * @method getForgedBlocks
 * @param generatorPublicKey
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getForgedBlocks = utils.wrapSendRequest(_constants.GET, 'blocks', function (generatorPublicKey) {
	return { generatorPublicKey: generatorPublicKey };
});

/**
 * @method getBlock
 * @param height
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getBlock = utils.wrapSendRequest(_constants.GET, 'blocks', function (height) {
	return {
		height: height
	};
});

/**
 * @method getTransactions
 * @param recipientId
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getTransactions = utils.wrapSendRequest(_constants.GET, 'transactions', function (recipientId) {
	return { recipientId: recipientId };
});

/**
 * @method getTransaction
 * @param transactionId
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getTransaction = utils.wrapSendRequest(_constants.GET, 'transactions', function (transactionId) {
	return { transactionId: transactionId };
});

/**
 * @method getVotes
 * @param address
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getVotes = utils.wrapSendRequest(_constants.GET, 'votes', function (address) {
	return {
		address: address
	};
});

/**
 * @method getVoters
 * @param username
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getVoters = utils.wrapSendRequest(_constants.GET, 'voters', function (username) {
	return { username: username };
});

/**
 * @method getUnsignedMultisignatureTransactions
 * @param data
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getUnsignedMultisignatureTransactions = utils.wrapSendRequest(_constants.GET, 'transactions/unsigned', function (data) {
	return data;
});

/**
 * @method getDapp
 * @param transactionId
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getDapp = utils.wrapSendRequest(_constants.GET, 'dapps', function (transactionId) {
	return { transactionId: transactionId };
});

/**
 * @method getDapps
 * @param data
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getDapps = utils.wrapSendRequest(_constants.GET, 'dapps', function (data) {
	return data;
});

/**
 * @method getDappsByCategory
 * @param category
 * @param optionsOrCallback
 * @param callbackIfOptions
 *
 * @return {Object}
 */

LiskAPI.prototype.getDappsByCategory = utils.wrapSendRequest(_constants.GET, 'dapps', function (category) {
	return { category: category };
});