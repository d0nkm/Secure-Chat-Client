const util = require('util');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const forge = require('node-forge');

var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res){
	res.render('index');
});

var users = {};

function User(socket){
	this.socket = socket;
	this.subscription = null;
}

function isValidMessage(msg){
	return (msg !== null && ('keyId' in msg));
}

io.on('connection', function (socket){
	console.log("connesso");
	var keyId, pubkey;
	var challenge = null;

	function verifyResponse(response){
		var sha2 = forge.md.sha256.create();
		sha2.update(challenge);

		if (pubkey.verify(sha2.digest().bytes(), response)){
			users[keyId] = new User(socket);
			socket.emit('auth.ok');
		} else {
			socket.emit('auth.fail');
		}
	}
	
	function relay(msg, ack){
		console.log("Relay for " + msg["keyId"]);

		if (!isValidMessage(msg)){
			// TODO Log error
			console.error('invalid message');
			return;
		} else if (!(msg.keyId in users)){
			// TODO Log error
			console.error('invalid key id (offline)', util.inspect(users));
			return;
		} else if (!users[msg.keyId].subscription == keyId){
			// TODO Log error
			console.error('invalid key id (no sub)');
			return;
		}

		var toSend = {};
		for (var key in msg){
			if (key === 'keyId') continue;
			toSend[key] = msg[key];
		}

		toSend.keyId = keyId;

		users[msg.keyId].socket.emit('relay', toSend);
	}

	socket.on('auth.pubkey', function (pem){
		console.log("Received public key");
		console.log(pem);
		pubkey = forge.pki.publicKeyFromPem(pem);
		keyId = forge.pki.getPublicKeyFingerprint(pubkey, { encoding: 'hex' });
		console.log("Parsed public key with id " + keyId);

		if (keyId in users){
			socket.emit('auth.fail', 'Already registered');
			return;
		}
		
		forge.random.getBytes(32, function (err, bytes){
			challenge = bytes;
			socket.emit('auth.challenge', challenge, verifyResponse);
			console.log("Challenge sent");
		});
	});

	socket.on('subscribe', function (id) {
		users[keyId].subscription = id;

		if (id in users && users[id].subscription == keyId){
			socket.emit('available', id);
			users[id].socket.emit('available', keyId);
		}
	});

	socket.on('relay', relay);

	socket.on('disconnect', function (){
		if (keyId in users){
			delete users[keyId];
		}
	});
});

server.listen(63007);
