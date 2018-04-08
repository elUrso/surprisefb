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
	let _path = path + "usertoken"
	return FB.getLoginUrl({
  	scope: 'email,user_likes,user_birthday,user_friends',
  	redirect_uri: _path})
}

let genToken = (c) => {
	let t = ""
	FB.api('oauth/access_token', {
    client_id: '582797802099987',
    client_secret: 'b8ceab9b09bb39786778cd0685852e44',
    redirect_uri: path + "usertoken",
    code: c
	}, function (res) {
			if(!res || res.error) {
					console.log(!res ? 'error occurred' : res.error);
					return;
			}
	
			var accessToken = res.access_token;
			var expires = res.expires ? res.expires : 0;
			console.log(accessToken)
			t =  accessToken
			return accessToken
	});
	return t
}

let extendToken = (t) => {
	let et = ""
	FB.api('oauth/access_token', {
    client_id: '582797802099987',
    client_secret: 'b8ceab9b09bb39786778cd0685852e44',
    grant_type: 'fb_exchange_token',
    fb_exchange_token: t
	}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
 
    var accessToken = res.access_token;
		var expires = res.expires ? res.expires : 0;
		console.log(accessToken)
		et = accessToken
		return accessToken
	});
	return et
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
	res.send(loginURL(req.cookies.session)
)})

app.get("/usertoken", (req, res) => {
	let c, t, et
	console.log(req)
	c = req.query.code
	console.log(c)
	t = genToken(req.query.code)
	console.log(t)
	et = extendToken(t)
	console.log(et)
	console.log("Gud Luck")
	res.send("Hi!")
})

app.listen(port, () => {
	console.log(port)
	console.log("Starting surprise server")
})