const path = "https://surprisefb.herokuapp.com/"
const port = process.env.PORT || 8080

let express = require('express')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let FB = require('fb')
let db = require('diskdb')

let app = express()

// Configure express middlewares
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static('cdn', {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())}}))

// Configure Facebook API
const fb_options = {
  appId: '582797802099987',
  autoLogAppEvents : true,
  xfbml            : true,
  version          : 'v2.12' 
}

FB.options(fb_options)

let loginURL = (s) => {
	let _path = path + "usertoken/" + s
	return FB.getLoginUrl({
  	scope: 'email,user_likes,user_birthday,user_friends',
  	redirect_uri: _path})
}

// Configure DB
db.connect('db', ['tokens', 'sessions', 'users'])

// Helper Functions

let isEmpty = (x) => {
	for (i in x) {
		return false;
	}
	return true;
}

let isValid = (x) => {
	if(db.sessions.find({session: x.session})) return true;
	return false;
}

// Server

app.get('/', (req, res) => {
	if(isEmpty(req.cookies) || isValid(req.cookies)) {
		res.redirect("/login")
	} else {
		res.redirect("/app")
}})

app.post('/new_session', (req, res) => {
	let session = db.sessions.count()
	db.sessions.save({session: session, token:'', valid: true})
	res.send(session.toString())
})

app.post('/oauth', (req, res) => {
	res.send(loginURL(req.cookies.session))
})

app.listen(port, () => {
	console.log(port)
	console.log("Starting surprise server")
})
