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
surprise.use(express.static('cdn', options))


// Configure Facebook API
const fb_options = {
  appId: '582797802099987',
  autoLogAppEvents : true,
  xfbml            : true,
  version          : 'v2.12' 
}

FB.options(fb_options)

// Configure DB
db.connect('db', ['tokens', 'sessions', 'users'])

app.get('/', (req, res) => {
	res.send('Hello World')
})

app.post('/new_session', (req, res) => {
	db.count("sessions")
})

app.listen(port, () => {
	console.log(port)
	console.log("Starting surprise server")
})
