const port = process.env.PORT || 8080

let express = require('express')

let app = express()

app.get('/', (req, res) => {
	res.send('Hello World')
})




app.listen(port, () => {
	console.log(port)
})
