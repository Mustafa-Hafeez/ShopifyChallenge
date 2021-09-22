/*jshint esversion: 6 */

window.onload = (function () {
	"use strict";
	let currentImageId = null;
	let currentUserId = null;
	let currentUserImage = 0;
	let currentGallery = 0;
	let commentPage = 0;

	api.onError(function (err) {
		console.error("[error]", err);
	});
	api.onError(function (err) {
		var error_box = document.querySelector('#error_box');
		error_box.innerHTML = err;
		error_box.style.visibility = 'visible';
	});

	api.onUserUpdate(function (username) {
		document.querySelector("#signin_button").style.visibility = (username) ? 'hidden' : 'visible';
		document.querySelector("#signout_button").style.visibility = (username) ? 'visible' : 'hidden';
		document.getElementById("gallery").style.visibility = (username) ? 'visible' : 'hidden';
		//might cause issues?
		currentUserId = username;
		//get image if logged in
		if (username) {
			//add user to user list drop down
			api.getImage(currentUserId, currentUserImage);
			document.getElementById('current_user').innerHTML = "Gallery of " + currentUserId;
		}
	});

	document.getElementById('prev_user').addEventListener('click', function (e) {
		error_box.style.visibility = "hidden";
		commentPage = 0;
		api.getNextUser(currentGallery--);
	});

	document.getElementById('next_user').addEventListener('click', function (e) {
		error_box.style.visibility = "hidden";
		commentPage = 0;
		api.getNextUser(currentGallery++);
	});

	document.getElementById('image_form').addEventListener('click', function (e) {
		// prevent from refreshing the page on submit
		e.preventDefault();
		let x = document.getElementById("add_item");
		if (x.style.display == '' || x.style.display == 'block') {
			x.style.display = 'none';
		} else {
			x.style.display = 'block';
		}
	});

	document.querySelector('#add_item').addEventListener('submit', function (e) {
		currentUserImage = 0;
		error_box.style.visibility = "hidden";
		e.preventDefault();
		let img_name = document.getElementById("img_name").value;
		let picture = document.getElementById("pic_file").files[0];
		api.addImage(img_name, picture);
		document.getElementById("add_item").reset();
		document.querySelector('#messages').innerHTML = '';
	});

	document.getElementById('prev_img').addEventListener('click', function (e) {
		error_box.style.visibility = "hidden";
		commentPage = 0;
		currentUserImage++;
		api.getImage(currentUserId, currentUserImage);
	});

	document.getElementById('next_img').addEventListener('click', function (e) {
		error_box.style.visibility = "hidden";
		commentPage = 0;
		currentUserImage--;
		api.getImage(currentUserId, currentUserImage);
	});

	document.getElementById('next_msg').addEventListener('click', function (e) {
		error_box.style.visibility = "hidden";
		if (commentPage > 0) {
			commentPage--;
		}
		api.getComments(currentImageId, commentPage);
	});

	document.getElementById('prev_msg').addEventListener('click', function (e) {
		error_box.style.visibility = "hidden";
		commentPage++;
		api.getComments(currentImageId, commentPage);
	});

	document.getElementById('del_image').addEventListener('click', function (e) {
		currentUserImage = 0;
		error_box.style.visibility = "hidden";
		if (currentImageId !== null) {
			api.deleteComments(currentImageId);
			api.deleteImage(currentImageId);
		}
	});

	api.onImageUpdate(function (image) {
		if (image === null) {
			document.querySelector('#current_image').innerHTML = '';
			document.querySelector('#messages').innerHTML = '';
			currentImageId = null;
		} else {
			document.querySelector('#current_image').innerHTML =
				`   <div id = "${image._id}"></div>
            <img class="image_url" src="/api/picture/${image._id}/" width="64" height="64">
            <!-- Might change to divs -->
            <p class="title">${image.title}</p>
            <p class="author">${image.author}</p>`;
			currentImageId = image._id;
		}
	});

	document.getElementById('create_message_form').addEventListener('submit', function (e) {
		error_box.style.visibility = "hidden";
		e.preventDefault();
		// prevent from refreshing the page on submit
		// read form elements
		let content = document.getElementById("post_content").value;
		// clean form
		document.getElementById("create_message_form").reset();
		api.addComment(currentImageId, content);
	});

	api.onCommentUpdate(function (comments) {
		document.querySelector('#messages').innerHTML = '';
		comments.forEach(function (comment) {
			let element = document.createElement('div');
			element.className = "message";
			element.innerHTML = `<div class="message_user">
                        <div class="message_username">${comment.author}</div>
                        </div>
                        <div class="message_content">${comment.content}</div>
                        <div class="message_date">${comment.createdAt}</div>
                        <button class="delete-icon icon">Delete Comment</button>`;
			element.querySelector('.delete-icon').addEventListener('click', function (e) {
				api.deleteComment(comment._id);
			});
			document.querySelector('#messages').prepend(element);
		});

		//display all of the imageId's comments

	});
}());