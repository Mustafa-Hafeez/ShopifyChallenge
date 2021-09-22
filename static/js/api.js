/*jshint esversion: 6 */
var api = (function () {
    "use strict";

	function sendFiles(method, url, data, callback) {
		let formdata = new FormData();
		Object.keys(data).forEach(function (key) {
			let value = data[key];
			formdata.append(key, value);
		});
		let xhr = new XMLHttpRequest();
		xhr.onload = function () {
			if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
			else callback(null, JSON.parse(xhr.responseText));
		};
		xhr.open(method, url, true);
		xhr.send(formdata);
	}

	function send(method, url, data, callback) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {
			if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
			else callback(null, JSON.parse(xhr.responseText));
		};
		xhr.open(method, url, true);
		if (!data) xhr.send();
		else {
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(JSON.stringify(data));
		}
	}
	var module = {};

	/*  ******* Data types *******
	    image objects must have at least the following attributes:
	        - (String) _id 
	        - (String) title
	        - (String) author
	        - (Date) date
    
	    comment objects must have the following attributes
	        - (String) _id
	        - (String) imageId
	        - (String) author
	        - (String) content
	        - (Date) date
    
	****************************** */
	let imageObservers = [];
	let commentObservers = [];
	let userListeners = [];

	module.extractUsername = function () {
		send("GET", "/api/username/", {}, function (err, res) {
			return res.session;
		});
	};
	let getUsername = function () {
		return document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
	};

	module.getNextUser = function (skip) {
		send("GET", "/api/users/" + skip + "/", {}, function (err, res) {
			if (err) return notifyErrorListeners(err);
			notifyUserListeners(res);
		});
	};

	function notifyImageObservers(imageId) {
		imageObservers.forEach(function (observer) {
			observer(imageId);
		});
	}

	function notifyCommentObservers(imageId) {
		commentObservers.forEach(function (observer) {
			observer(imageId);
		});
	}

	function notifyUserListeners(username) {
		userListeners.forEach(function (listener) {
			listener(username);
		});
	}

	module.onUserUpdate = function (listener) {
		userListeners.push(listener);
		listener(getUsername());
	};

	module.signin = function (username, password) {
		send("POST", "/signin/", {
			username,
			password
		}, function (err, res) {
			if (err) return notifyErrorListeners(err);
			notifyUserListeners(getUsername());
		});
	};

	module.signup = function (username, password) {
		send("POST", "/signup/", {
			username,
			password
		}, function (err, res) {
			if (err) return notifyErrorListeners(err);
			notifyUserListeners(getUsername());
		});
	};

	// add an image to the gallery
	module.addImage = function (title, file) {
		sendFiles("POST", "/api/images/", {
			title: title,
			picture: file
		}, function (err, res) {
			if (err) return notifyErrorListeners(err);
			notifyImageObservers(res);
			send("GET", "/api/comments/" + res._id + "/", {}, function (err, comments) {
				if (err) return notifyErrorListeners(err);
				notifyCommentObservers(comments);
			});
		});
	};

	module.getImage = function (username, skip) {
		let url = "/api/images/" + username + "/" + skip + "/";
		send("GET", url, {}, function (err, res) {
			if (err) return notifyImageObservers(null);
			notifyImageObservers(res);
			send("GET", "/api/comments/" + res._id + "/", {}, function (err, comments) {
				if (err) return notifyErrorListeners(err);
				notifyCommentObservers(comments);
			});
		});
	};

	// delete an image from the gallery given its imageId
	module.deleteImage = function (imageId) {
		//change pic to prev first

		send("DELETE", "/api/images/" + imageId + "/", null, function (err, res) {
			if (err) return notifyErrorListeners(err);
			module.getImage(res.author, 0);
		});

	};

	// add a comment to an image
	module.addComment = function (imageId, content) {
		//make post request & update comment caller
		send("POST", "/api/comments/", {
			imageId: imageId,
			content: content
		}, function (err, res) {
			if (err) return notifyErrorListeners(err);
			send("GET", "/api/comments/" + imageId + "/", {}, function (err, comments) {
				if (err) return notifyErrorListeners(err);
				notifyCommentObservers(comments);
			});
		});
	};

	// delete a comment to an image
	module.deleteComment = function (commentId) {
		send("DELETE", "/api/comments/" + commentId + "/", {}, function (err, res) {
			if (err) return notifyErrorListeners(err);
			send("GET", "/api/comments/" + res.imageId + "/", {}, function (err, comments) {
				if (err) return notifyErrorListeners(err);
				notifyCommentObservers(comments);
			});
		});
	};

	module.deleteComments = function (imageId) {
		send("DELETE", "/api/images/comments/" + imageId + "/", {}, function (err, res) {
			if (err) return notifyErrorListeners(err);
		});
	};

	module.getComments = function (imageId, page) {
		send("GET", "/api/comments/" + imageId + "/" + page, {}, function (err, comments) {
			if (err) return notifyErrorListeners(err);
			if (comments.length > 0) {
				notifyCommentObservers(comments);
			}
		});
	};
	// call handler when an image is added or deleted from the gallery
	module.onImageUpdate = function (handler) {
		imageObservers.push(handler);
	};

	// call handler when a comment is added or deleted to an image
	module.onCommentUpdate = function (handler) {
		commentObservers.push(handler);
	};
	let errorListeners = [];

	function notifyErrorListeners(err) {
		errorListeners.forEach(function (listener) {
			listener(err);
		});
	}

	module.onError = function (listener) {
		errorListeners.push(listener);
	};

	return module;
})();