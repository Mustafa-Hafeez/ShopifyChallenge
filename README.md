# WEBGALLERY REST API Documentation

## Intructions
- CD to imageRepo directory
- Confirm you have the latest node/npm versions
- run npm install
- run node app.js
- Open web browser (Pref Google Chrome) to localhost:3000
- Sign Up and Sign In and use app as required


## Login API

### Signup

- description: sign up for application
- request: `POST /signup/`
    - content-type: `application/json`
    - body: object
      - username: (string) username of user
      - password: (string) the users password
- response: 200
    - content-type: `application/json`
    - body: string
        - user "username" has successfully signed up
- response: 409
    - body: username "username" already exists
``` 
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -d '{"username":"hello world","password":"me"} 
       http://localhost:3000/api/signup/'
```
### Signin
- description: sign into application
- request: `POST /signin/`
    - content-type: `application/json`
    - body: object
      - username: (string) username of user
      - password: (string) the users password
- response: 200
    - content-type: `application/json`
    - body: string
        - user "username" signed in
- response: 401
    - body: access denied
``` 
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -d '{"username":"hello world","password":"me"} 
       http://localhost:3000/api/signin/'
```
### Signout
- description: sign out of application
- request: `POST /signin/`
    - content-type: `application/json`
    - session: user that has the current session open
- response: 200
    - content-type: `application/json`
``` 
$ curl -X POST 
       -H "Content-Type: `application/json`"
       -c cookie.txt
       http://localhost:3000/api/signout/'
```
### Get Username
- description: Get username of current user session
- request: `GET /api/username/`
    - content-type: `application/json`
    - body: object
      - session: (string) the users password
- response: 200
    - content-type: `application/json`
    - session: username of user logged into the current session
- response: 401
    - body: access denied
``` 
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -c cookie.txt
       http://localhost:3000/api/username/'
```

## Image API

### Create

- description: create a new image
- request: `POST /api/images/`
    - content-type: `application/json`
    - body: object
      - title: (string) the title of the image
      - picture: (file.req) users image file
    - session: current open session of user
- response: 200
    - content-type: `application/json`
    - body: object
      - _id: (string) the message id
      - title: (string) the content of the image
      - author: (string) the authors username
      - picture: (file.req) users image file
- response: 401
    - body: access denied
``` 
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -d '{"title":"hello world","author":"me", "picture":"filepath"}
       -c cookie.txt
       http://localhost:3000/api/messages/'
```

### Read

- description: retrieve the image given the image id
- request: `GET /api/picture/:imageId?`
- response: 200
    - content-type: `image/jpeg/`
    - body: image
      - the image given id
- response: 404
    - body: ImageId "imageId" does not exist
- parameters: imageId
    -id of the image
- response: 401
    - body: access denied

``` 
$ curl -c cookie.txt http://localhost:3000/api/picture/70/ 

``` 


- description: retrieve the image info of the given the username
- request: `GET /api/images/:username/:num?`
- response: 200
    - content-type: `application/json`
    - body: object
      - title: (string) image title
      - author: (string) image author
      - _id: (string) image id
- response: 404
    - body: No images in database
- parameters: navigation to prev or next image in db
    - num (string): specify which image of the user you want to grab
- response: 401
    - body: access denied
``` 
$ curl -c cookie.txt http://localhost:3000/api/images/info/70/
``` 


- description: retrieve the image info of the given the image id
- request: `GET /api/images/length/`
- response: 200
    - content-type: `application/json`
    - body: object
      - length: (string) num of images in db

``` 
$ curl http://localhost:3000/api/images/length/
``` 
  

### Delete
  
- description: delete the image with given id
- request: `DELETE /api/images/:id/`
- response: 200
    - content-type: `application/json`
    - body: object
        - _id: (string) the images id
        - createdAt: (string) the time image was created
        - updatedAt: (string) last udate of the image
        - title: (string) the title of image
        - author: (string) the author of the string
        - picture: (object) the file.req of image file
- response: 404
    - body: image :id does not exists
- response: 401
    - body: access denied
    

``` 
$ curl -X DELETE -c cookie.txt
       http://localhost:3000/api/images/208/
``` 


## Comments API

### Create

- description: create a new comment
- request: `POST /api/comments/`
    - content-type: `application/json`
    - body: object
      - imageId: (string) the imageId of the comment
      - content: (string) comment for given picture
- response: 200
    - content-type: `application/json`
    - body: object
      - _id: (string) the comment id
      - imageId: (string) the comments imageId
      - author: (string) the authors username
      - content: (string) the comment message
      - createdAt: (string) when the comment was created
      - updatedAt: (string) when comment was last updated    
- response: 401
    - body: access denied
```  
$ curl -X POST 
       -H "Content-Type: `application/json`" 
       -c cookie.txt
       -d '{"content":"hello world","author":"me", "imageId":"89"} 
       http://localhost:3000/api/comments/'
```

### Read

- description: retrieve the last 5 comments on given image
- request: `GET /api/comments/:imageId/:page?`
    - parameters:
        - page: (int) specify which page of comments to retrieve
- response: 200
    - content-type: `application/json`
    - body: (objects) last 5 comments on given image 
      - _id: (string) the comment id
      - imageId: (string) the comments imageId
      - author: (string) the authors username
      - content: (string) the comment message
      - createdAt: (string) when the comment was created
      - updatedAt: (string) when comment was last updated
- response: 404
    - body: No image with given id
- response: 401
    - body: access denied
 
``` 
$ curl -c cookie.txt http://localhost:3000/api/comments/78/2
``` 


### Delete
  
- description: delete the comment with given (comment) id
- request: `DELETE /api/comments/:id/`
- response: 200
    - content-type: `application/json`
    - body: object
        - _id: (string) the comments id
        - createdAt: (string) the time comment was created
        - updatedAt: (string) last update of the comment
        - content: (string) the comment message
        - author: (string) the author of the comment
        - imageId: (string) the imageId of said comment
- response: 404
    - body: comment :id does not exists
- response: 401
    - body: access denied

``` 
$ curl -X DELETE -c cookie.txt
       http://localhost:3000/api/comments/208/
``` 

- description: delete all comments of given (image) id
- request: `DELETE /api/images/comments/:id/`
- response: 200
    - content-type: `application/json`
    - body: (objects)
        - _id: (string) the comments id
        - createdAt: (string) the time comment was created
        - updatedAt: (string) last update of the comment
        - content: (string) the comment message
        - author: (string) the author of the comment
        - imageId: (string) the imageId of said comment
- response: 404
    - body: image :id does not exists
- response: 401
    - body: access denied

``` 
$ curl -X DELETE
       http://localhost:3000/api/images/comments/208/
``` 
