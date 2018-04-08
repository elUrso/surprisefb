const path = "https://surprisefb.herokuapp.com/"
const port = process.env.PORT || 8080

let express = require('express')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let FB = require('fb')
let db = require('diskdb')
let request = require('request')

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


let genToken = (c, n) => {
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
			console.log('c')
			console.log(c)
			console.log(accessToken)
			extendToken(accessToken, c, n)
	});
}

let extendToken = (t, c, n) => {
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
		let et = accessToken
		console.log('et')
		console.log(accessToken)
		console.log(n, et)
		db.sessions.update({session: n}, {session: n, token: et, valid: true})
		console.log(db.sessions.find({session: n}))
		updateUserToken(et)
	});
}

// Configure DB
db.connect('db', ['tokens', 'sessions', 'users'])

// Helper Functions

let getLikes = (t, res) => {
	let path = "https://graph.facebook.com/v2.12/me/likes?access_token=" + t
	res.redirect(path)
}

let getFriends = (t, res) => {
	let path = "https://graph.facebook.com/v2.12/me/friends?access_token=" + t
	res.redirect(path)
}	

let updateUserToken = (t) => {
	const path = "https://graph.facebook.com/v2.12/me?access_token=" + t
	request(path, (e, res, body) => {
		if(e) {
			console.log("error on update")
			return;
		}
		json = JSON.parse(body)
		console.log({id: json.id}, {id: json.id, token: t})
		db.users.update({id: json.id}, {id: json.id, token: t}, {upsert: true})
	})

}

let isEmpty = (x) => {
	for (i in x) {
		return false;
	}
	return true;
}

let isValid = (x) => {
	if(db.sessions.find({session: Number(x.session)}[0])) return true;
	return false;
}

// Server

app.get('/', (req, res) => {
	if(isEmpty(req.cookies) || isValid(req.cookies)) {
		res.redirect("/login")
	} else {
		res.redirect("/friends")
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
	let c, t, et, n;
	n = Number(req.cookies.session)
	c = req.query.code
	genToken(c, n)
	console.log("Gud Luck")
	res.redirect("/friends")
})

app.get("/likes", (req, res) => {
	console.log(db.users)
	console.log(req.query.id)
	console.log(db.users.find({id: req.query.id}))
	let user =  db.users.find({id: req.query.id})[0]
	let token = user.token
	getLikes(token, res)
})

app.get("/friendList", (req, res) => {
	const n = Number(req.cookies.session)
	const t = db.sessions.find({session: n})[0].token
	getFriends(t, res)
})

app.listen(port, () => {
	console.log(port)
	console.log("Starting surprise server")
})