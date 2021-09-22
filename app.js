/*jshint esversion: 6 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
const multer = require('multer');
var upload = multer({
	dest: 'uploads/'
});
const Datastore = require('nedb');

let users = new Datastore({
	filename: 'db/users.db',
	autoload: true,
	timestampData: true
});
let images = new Datastore({
	filename: path.join(__dirname, 'db', 'images.db'),
	autoload: true,
	timestampData: true
});
let comments = new Datastore({
	filename: path.join(__dirname, 'db', 'comments.db'),
	autoload: true,
	timestampData: true
});

const cookie = require('cookie');

const session = require('express-session');
app.use(session({
	secret: 'extra secret saucy',
	resave: false,
	saveUninitialized: true,
}));

function generateSalt() {
	return crypto.randomBytes(16).toString('base64');
}

function generateHash(password, salt) {
	var hash = crypto.createHmac('sha512', salt);
	hash.update(password);
	return hash.digest('base64');
}

app.use(function (req, res, next) {
	var username = (req.session.username) ? req.session.username : '';
	res.setHeader('Set-Cookie', cookie.serialize('username', username, {
		path: '/',
		maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
	}));
	next();
});

app.use(express.static('static'));

app.use(function (req, res, next) {
	console.log("HTTP request", req.method, req.url, req.body);
	next();
});

var isAuthenticated = function (req, res, next) {
	if (!req.session.username) return res.status(401).end("access denied");
	next();
};

app.post('/signup/', function (req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	users.findOne({
		_id: username
	}, function (err, user) {
		if (err) return res.status(500).end(err);
		if (user) return res.status(409).end("username " + username + " already exists");
		var salt = generateSalt();
		var hash = generateHash(password, salt);
		users.update({
			_id: username
		}, {
			_id: username,
			salt,
			hash
		}, {
			upsert: true
		}, function (err) {
			if (err) return res.status(500).end(err);
			return res.json("user " + username + " signed up");
		});
	});
});

app.post('/signin/', function (req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	// retrieve user from the database
	users.findOne({
		_id: username
	}, function (err, user) {
		if (err) return res.status(500).end(err);
		if (!user) return res.status(401).end("access denied");
		if (user.hash !== generateHash(password, user.salt)) return res.status(401).end("access denied"); // invalid password
		// start a session
		req.session.username = user._id;
		res.setHeader('Set-Cookie', cookie.serialize('username', user._id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
		}));
		return res.json("user " + username + " signed in");
	});
});

app.get('/signout/', function (req, res, next) {
	req.session.destroy();
	res.setHeader('Set-Cookie', cookie.serialize('username', '', {
		path: '/',
		maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
	}));
	res.redirect('/');
});

app.get('/api/username/', isAuthenticated, function (req, res, next) {
	res.json({
		session: req.session.username
	});
});

//get image info in db given username
app.get('/api/images/:username/:num', isAuthenticated, function (req, res, next) {
	images.count({
		author: req.params.username
	}).exec(function (err, count) {
		let skip;
		if (err) return res.status(500).end(err);
		if (req.params.num >= count) {
			skip = req.params.num % count;
		} else if (req.params.num < 0) {
			skip = (req.params.num % count) * -1;
		} else {
			skip = req.params.num;
		}
		images.find({
			author: req.params.username
		}).sort({
			createdAt: -1
		}).skip(skip).exec(function (err, docs) {
			if (err) return res.status(500).end(err);
			if (!docs[0]) return res.status(404).end("No images in Database!");
			image = docs[0];
			res.json({
				title: image.title,
				author: image.author,
				_id: image._id
			});
		});
	});

});

//get image based on image id from db
app.get('/api/picture/:imageId', isAuthenticated, function (req, res, next) {
	images.findOne({
		_id: req.params.imageId.toString()
	}).exec(function (err, image) {
		if (err) return res.status(500).end(err);
		if (!image) return res.status(404).end("Image id: " + req.params.imageId + "does not exist!");
		let profile = image.picture;
		res.setHeader('Content-Type', profile.mimetype);
		res.sendFile(path.join(__dirname, profile.path));
	});
});

//Add an image
app.post('/api/images/', isAuthenticated, upload.single('picture'), function (req, res, next) {
	let id = Math.floor(Math.random() * 1000);
	let imageObj = {
		title: req.body.title,
		author: req.session.username,
		picture: req.file,
		_id: id.toString()
	};
	images.insert(imageObj);
	res.json(imageObj);
});

//delete image
app.delete('/api/images/:_id/', isAuthenticated, function (req, res, next) {
	images.findOne({
		_id: req.params._id
	}, function (err, image) {
		if (err) return res.status(500).end(err);
		if (!image) return res.status(404).end("Image id #" + req.params.id + " does not exists");
		if (req.session.username === image.author) {
			//https://stackoverflow.com/a/63294447
			fs.unlink(image.picture.path, (err) => {
				if (err) {
					console.error(err);
					return;
				}
			});
			images.remove({
				_id: image._id
			}, {
				multi: false
			}, function (err, num) {
				res.json(image);
			});
		} else {
			return res.status(401).end("access denied");
		}

	});
});

//delete all comments for a specific image
app.delete('/api/images/comments/:_id/', isAuthenticated, function (req, res, next) {
	comments.find({
		imageId: req.params._id
	}, function (err, comms) {
		if (err) return res.status(500).end(err);
		if (!comms) return res.status(404).end("Image id #" + req.params.id + " does not exists");
		comments.remove({
			imageId: req.params._id
		}, {
			multi: true
		}, function (err, num) {
			res.json(comms);
		});
	});
});

//gets next/prev user
app.get('/api/users/:num', isAuthenticated, function (req, res, next) {
	users.count({}).exec(function (err, count) {
		let skip;
		if (err) return res.status(500).end(err);
		if (req.params.num >= count) {
			skip = req.params.num % count;
		} else if (req.params.num < 0) {
			skip = (req.params.num % count) * -1;
		} else {
			skip = req.params.num;
		}
		users.find({}).skip(skip).sort({
			createdAt: 1
		}).exec(function (err, users) {
			if (err) return res.status(500).end(err);
			if (!users[0]) return res.status(404).end("No images in Database!");
			res.json(users[0]._id);
		});
	});

});

//gets comments for given image based on page
app.get('/api/comments/:imageId/:page?', isAuthenticated, function (req, res, next) {
	//find item based on image id
	let page = req.params.page;
	if (!req.params.page) {
		page = 0;
	}
	comments.find({
		imageId: req.params.imageId
	}).sort({
		createdAt: -1
	}).skip(5 * page).limit(5).exec(function (err, comment) {
		if (err) return res.status(500).end(err);
		return res.json(comment.reverse());
	});
});

//posts a new comment to the given image id
app.post('/api/comments/', isAuthenticated, function (req, res, next) {
	let newComment = {};
	newComment.imageId = req.body.imageId;
	newComment.author = req.session.username;
	newComment.content = req.body.content;
	comments.insert(newComment, function (err, comment) {
		if (err) return res.status(500).end(err);
		return res.json(comment);
	});
});

//deletes specific comment on image
app.delete('/api/comments/:_id/', isAuthenticated, function (req, res, next) {
	comments.findOne({
		_id: req.params._id
	}, function (err, comment) {
		if (err) return res.status(500).end(err);
		if (!comment) return res.status(404).end("Comment id #" + req.params.id + " does not exists");
		//find image author
		images.findOne({
			_id: comment.imageId
		}).exec(function (err, image) {
			if (err) return res.status(500).end(err);
			if (comment.author === req.session.username || image.author === req.session.username) {
				comments.remove({
					_id: comment._id
				}, {
					multi: false
				}, function (err, num) {
					res.json(comment);
				});
			} else {
				res.status(401).end("access denied");
			}
		});

	});
});

const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
	if (err) console.log(err);
	else console.log("HTTP server on http://localhost:%s", PORT);
});