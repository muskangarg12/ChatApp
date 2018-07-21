
const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000).sockets;

//connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, client){
	if(err){ 
		throw err;
	}
	 console.log('MongoDB connected...');

	 //connect to socket.io
	io.on('connection', function(socket){
		var chat = client.db('mongochat').collection('chats');

		//create function to send status
		sendStatus = function(s){
			socket.emit('status', s);
		}

		//get chats from mongo collection
		chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
			if(err){
				throw err;
			}

			//emit the messages
			socket.emit('output', res);
		});

		//handle input events
		socket.on('input', function(data){
			let name = data.name;
			let message = data.message;

			//check for name and message
			if(name == '' || message == ''){
				//send error status
				sendStatus('Please enter a name and message');
			} else {
				//insert message
				chat.insert({name: name , message: message}, function(){
					io.emit('output', [data]);

					//send status object
					sendStatus({
						message: 'Message sent',
						clear: true
					});
				});
			}
		});

		//handle clear
		socket.on('clear', function(data){
			console.log('chat cleared');
			//remove all chats from collection
			chat.remove({}, function(){
				// emit cleared
				socket.emit('cleared');
			});
		});
	});

});