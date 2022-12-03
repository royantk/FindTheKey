const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const hostname = 'localhost'

app.use('/static', express.static(path.join(__dirname, '/static')))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/static/index.html'));
})


app.listen(port, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
})
