require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require("socket.io");
const cors = require('cors');
const bodyParser = require('body-parser');
const axiosInstance = require('./lib/axiosInstance');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

io.on('connection', (socket) => {
    console.log('a user connected ' + socket.id);

    socket.on("user-id", (data) => {
        console.log('user-id', data);
    });
    
    socket.on("driver-location", (data) => {
        axiosInstance
            .post('/driver-location', data)
            .then((response) => {
                console.log(response.data);
            })
            .catch((error) => {
                console.error('[Error]', error.response.data);
            });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected ' + socket.id);
    });
});

server.listen(process.env.PORT, () => {
    console.log('listening on *:' + process.env.PORT);
});