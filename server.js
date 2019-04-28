var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var app = express();
var fs = require('fs');

app.use(session({
	secret: '2347095302',
	cookie: {maxAge: 60 * 1000 * 30}
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

var server = app.listen(5000, function(){
	var port = server.address().port;
	console.log("The server is on port %s .", port);
})

app.get('/', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})

app.get('/create', function(req, res){
	res.sendFile( __dirname + "/" + "create.html" );
})

app.get('/login', function(req, res){
	res.sendFile( __dirname + "/" + "login.html" );
})


app.get('/main.html', function (req, res) {
	res.send(req.session.username);
   res.sendFile( __dirname + "/" + "main.html" );
})

app.get('/account.html', function (req, res) {
   res.sendFile( __dirname + "/" + "account.html" );
})

app.get('/board.html', function (req, res) {
   res.sendFile( __dirname + "/" + "board.html" );
})

app.get('/reset.html', function (req, res) {
   res.sendFile( __dirname + "/" + "reset.html" );
})

app.get('/delete.html', function (req, res) {
   res.sendFile( __dirname + "/" + "delete.html" );
})

app.get('/record.html', function (req, res) {
   res.sendFile( __dirname + "/" + "record.html" );
})

//Database
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/scorechart";

Date.prototype.Format = function (fmt) { 
    var o = {
        "M+": this.getMonth() + 1, 
        "d+": this.getDate(), 
        "h+": this.getHours(), 
        "m+": this.getMinutes(),
        "s+": this.getSeconds(), 
        "q+": Math.floor((this.getMonth() + 3) / 3), 
        "S": this.getMilliseconds() 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

var currentTime = new Date().Format("yyyy-MM-dd hh:mm:ss");

app.put('/createbutton', function(req, res){
	res.redirect('create.html');
})

app.put('/loginbutton', function(req, res){
	res.redirect('login.html');
})

app.put('/playbutton', function(req, res){
	if(!req.session.sign){
		res.redirect("login.html");
	}else{
		res.redirect('main.html');
	}
})

app.put('/accountbutton', function(req, res){
	if(!req.session.sign){
		res.redirect("login.html");
	}else{
		res.redirect('account.html');
	}
})

app.put('/boardbutton', function(req, res){
	res.redirect('board.html');
})

app.put('/resetbutton', function(req, res){
	if(!req.session.sign){
		res.redirect("login.html");
	}else{
		res.redirect('reset.html');
	}
})

app.put('/deletebutton', function(req, res){
	if(!req.session.sign){
		res.redirect("login.html");
	}else{
		res.redirect('delete.html');
	}
})

app.put('/create', function(req, res){
	var accountInfo = {
		"username": req.body.username,
		"password": req.body.password
	};

	var username = {
		"username": req.body.username
	}

	var userInfo = {
		"username": req.body.username,
		"createdate": currentTime
	}
	usernameLength = accountInfo.username.length;
	passwordLength = accountInfo.password.length;
	
	

	if(usernameLength < 3){
		res.send("Username must be longer than 3.");
	}else if(usernameLength > 12){
		res.send("Username must be shorter than 12");
	}else if(passwordLength < 6){
		res.send("Password must be longer than 6.");
	}else if(usernameLength > 12){
		res.send("Username must be longer than 3");
	}else{
		
		MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
			if(err){
				throw err;
			}

			var dbase = db.db("scorechart");

			dbase.collection("accountinfo").find(username).toArray(function(err, data){
				if(err){
					throw err;
				}
				if(data.length > 0){
					res.send("User is already exsited.");
					console.log(data);
				}else{
					dbase.collection("accountinfo").insertOne(accountInfo, function(err, res){
						if(err){
							throw err;
						}
						
					});
					dbase.collection(accountInfo.username).insertOne(userInfo, function(err, res){
						if(err){
							throw err;
						}
					});
					db.close();
					req.session.sign = true;
					req.session.username = username.username;
					res.redirect(301, 'main.html');
				}
			});

			
		});
		
	}
	
	
});

app.put('/login', function(req, res){
	var response = {
		"username": req.body.username,
		"password": req.body.password,
		
	};

	var username = {
		"username": req.body.username
	}
	

	console.log(username);

	if(req.session.sign){
		res.redirect(301, 'main.html');
	}
	else{
		MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
			if(err){
				throw err;
			}

			var dbase = db.db("scorechart");
			var cursor = dbase.collection("accountinfo").find(username);
			cursor.toArray(function(err, data){
				if(data.length == 0){
					res.send("wrong username");
				}else{
					var password = data[0].password;
					if(response.password == password){
						req.session.sign = true;
						req.session.username = username.username;
						res.redirect(301, 'main.html');
					}else{
						res.send("wrong password");
					}
				}
				
			});
			db.close();
		});
	}
});

app.put('/logout', function(req, res){
	req.session.destroy();
	res.redirect('/');
});

app.put('/reset', function(req, res){
	var response = {
		"username": req.body.username,
		"password": req.body.password
	};

	var username = {
		"username": req.body.username
	}

	var newpassword = {
		"password": req.body.newpassword
	}	

	MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
		if(err){
			throw err;
		}

		var dbase = db.db("scorechart");
		var cursor = dbase.collection("accountinfo").find(username);
		cursor.toArray(function(err, data){
			var password = data[0].password;
			if(response.password == password){
				passwordLength = newpassword.password.length;
				if(passwordLength < 6){
					res.send("Password must be longer than 6.");
				}else if(passwordLength > 12){
					res.send("Password must be shorter than 12");
				}else{
					var updatedpassword = {
						$set:{
							"password": newpassword.password
						}
					}
					dbase.collection("accountinfo").updateOne(username, updatedpassword, function(err, res){
						if(err){
							throw err;
						}
					});
					db.close();
					res.redirect('/main.html');
				}
			}else{
				res.send("wrong password");
			}
		});
		
	})
});

app.put('/delete', function(req, res){
	var response = {
		"username": req.body.username,
		"password": req.body.password
	};

	var username = {
		"username": req.body.username
	}

	MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
		if(err){
			throw err;
		}

		var dbase = db.db("scorechart");

		var cursor = dbase.collection("accountinfo").find(username);
		cursor.toArray(function(err, data){
			if(response.password == data[0].password){
				dbase.collection("accountinfo").deleteOne(response, function(err, obj){
					if(err){
						throw err;
					}		
				});
				dbase.collection("allscore").deleteMany(username, function(err, obj){
					if(err){
						throw err;
					}		
				});
				dbase.collection(response.username).drop(function(err, delOK){
					if(err){
						throw err;
					}
					db.close();
				});
				req.session.destroy();
				res.redirect('/index.html');
				
			}else{
				res.send("wrong password");
			}
		});
	});
});

app.put('/addscore', function(req, res){
	var username = {
		"username": req.session.username
	}

	var score = parseInt(req.body.score);

	var score = {
		"username": req.session.username,
		"score": score,
		"time": currentTime
	}

	console.log(username.username);

	MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
		if(err){
			throw err;
		}

		var dbase = db.db("scorechart");
		dbase.collection("allscore").insertOne(score, function(err, res){
			if(err){
				throw err;
			}
		});
		dbase.collection(username.username).insertOne(score, function(err, res){
			if(err){
				throw err;
			}
			db.close();
		});
		var sort = {score: -1};
		dbase.collection(username.username).find({}).sort(sort).toArray(function(err, data){
			if(err){
				throw err;
			}
			res.json({
				message: "success",
				data
			})
		})
	});
});

app.put('/myscore', function(req, res){
	var username = {
		"username": req.session.username
	}

	MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
		if(err){
			throw err;
		}

		var sort = {score: -1};
		var dbase = db.db("scorechart");
		dbase.collection(username.username).find({}).sort(sort).toArray(function(err, data){
			if(err){
				throw err;
			}
			res.json({
				message: "success",
				data
			})
			db.close();
		});
	})
});

app.put('/allscore', function(req, res){
	MongoClient.connect(url, {useNewUrlParser: true}, function(err, db){
		if(err){
			throw err;
		}

		var sort = {score: -1};
		var dbase = db.db("scorechart");
		dbase.collection("allscore").find({}).sort(sort).toArray(function(err, data){
			if(err){
				throw err;
			}
			res.json({
				message: "success",
				data
			})
			db.close(); 
		})
	})
})




























































