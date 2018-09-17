let config = require('../config.js')
let uploadController = require('../controllers/uploadController')
let albumsController = require('../controllers/albumsController')
let tokenController = require('../controllers/tokenController')
let authController = require('../controllers/authController')
let route = require('express').Router()


function shallowCopy(obj) {
    var result = {};
    for (var i in obj) {
        result[i] = obj[i];
    }
    return result;
}

let api = {}

function check (req, res, next) {
  return res.json({
    private: config.private,
    maxFileSize: config.uploads.maxSize,
    register: config.enableUserAccounts,
    encoding: config.allowEncoding,
    usingS3: config.s3.use,
    blockedExtensions: config.blockedExtensions
  })
}



const map = {
  'get': {
    'check': {
		'function': check,
		'auth': false,
	},
    'admins': {
		'function': authController.listAdmins,
		'auth': true,
		'admin': true,
	},
	'admincheck': {
		'function': authController.adminCheck,
		'auth': true,
	},
    'account/list': {
		'function': authController.listAccounts,
		'auth': true,
		'admin': true,
	},
    'uploads': {
		'function': uploadController.list,
		'auth': true,
	},
    'uploads/:page': {
		'function': uploadController.list,
		'auth': true,
	},
    'gdelete/:deletekey': {
		'function': uploadController.delete,
	},
    'album/get/:identifier': {
		'function': albumsController.get,
	},
    'album/zip/:identifier': {
		'function': albumsController.generateZip,
		'disabled': true,
	},
    'album/:id': {
		'function': uploadController.list,
		'auth': true,
	},
    'album/:id/:page': {
		'function': uploadController.list,
		'auth': true,
	},
    'albums': {
		'function': albumsController.list,
		'auth': true,
	},
    'albums/:sidebar': {
		'function': albumsController.list,
		'auth': true,
	},
    'tokens': {
		'function': tokenController.list,
		'auth': true,
	},
	
	// base call
    '': {
		'function': function (req, res, next) {
		  return res.send('Nothing here!')
		}
	},
	
  },
  'post': {
    'login': {
		'function': authController.verify,
		'auth': false,
	},
    'register': {
		'function': authController.register,
		'auth': false,
	},
    'account/delete': {
		'function': authController.deleteAccount,
		'auth': true,
	},
    'account/disable': {
		'function': authController.disableAccount,
		'auth': true,
	},
    'password/change': {
		'function': authController.changePassword,
		'auth': true,
	},
    'upload': {
		'function': uploadController.upload,
		'auth': config.private,
	},
    'upload/delete': {
		'function': uploadController.delete,
		'auth': true,
	},
    'upload/:albumid': {
		'function': uploadController.upload,
		'auth': true,
	},
    'albums': {
		'function': albumsController.create,
		'auth': true,
	},
    'albums/delete': {
		'function': albumsController.delete,
		'auth': true,
	},
    'albums/rename': {
		'function': albumsController.rename,
		'auth': true,
	},
    'tokens/verify': {
		'function': tokenController.verify,
	},
    'tokens/change': {
		'function': tokenController.change,
		'auth': true,
	}
  }
}
const defaults = {
	'admin': false,
	'auth': false,
	'disabled': false,
};
function setRoutes (routes, log = true) {
  let i = 0
  for (let type in map) {
	  for (let key in map[type]) {
		  let obj = map[type][key]
		  let _objc = shallowCopy(obj);

		  for(var ky in _objc) {
			let _found = false;
			for(var key2 in defaults) { if(key2 === ky) _found = true; }
			if(!_found) { 
				_objc[ky] = defaults[ky]; 
				_objc.function = obj.function;
				obj = _objc;
			}
		  }
		  
				  
		  if(typeof(obj['function']) === 'function') {
			  let _handleCall = async function(req, res, next, _callbackFunction, _options) {
				 console.log(_options);
				  // Handle auth
				  
				  _callbackFunction(req, res, next);
			  }
			  
			  let _opts = shallowCopy(obj);
			  delete _opts['function'];
			  console.log(_opts);
			  
			  routes[type](`/${key}`, (req, res, next) => _handleCall(req, res, next, obj['function'], _opts))
			  if (log) console.log(`Loaded API ${type.toUpperCase()} route '/${key}'`)
			  i++
		  } else {
			  console.log(`Error with API call ${type.toUpperCase()} - '/${key}' - No callback func defined!`);
			}
	  }
  }
  console.log(`Loaded ${i} API routes!`)
  api.routes = routes
}

api.reloadModules = function () {
  require.cache = new Array()
  config = require('../config.js')
  uploadController = require('../controllers/uploadController')
  uploadController.reloadModules()
  albumsController = require('../controllers/albumsController')
  albumsController.reloadModules()
  tokenController = require('../controllers/tokenController')
  tokenController.reloadModules()
  authController = require('../controllers/authController')
  authController.reloadModules()
  route = require('express').Router()
  setRoutes(route, false)
  console.log('Reloaded')
}

setRoutes(route, true)
module.exports = api
