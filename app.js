require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require("socket.io");
const cors = require('cors');
const bodyParser = require('body-parser');
const axiosInstance = require('./lib/axiosInstance');

async function main() {
    console.log('Starting server...');

    try {
        console.log('Deleting old sockets...');
        await axiosInstance.delete('/delete-all-sockets');
    } catch (error) {
        console.error('[Error]', error);
    }

    console.log('Starting express server...');
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

    app.post('/send-to-client', (req, res) => {
        const { socket_ids, channel, data } = req.body;

        console.log('send-to-client', req.body);

        if (!socket_ids?.length || !channel || !data) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        for (let socket_id of socket_ids) {
            io.to(socket_id).emit(channel, data);
        }

        return res.json({ message: 'Message sent' });
    });

    io.on('connection', (socket) => {
        console.log('a user connected ' + socket.id);

        socket.on("user-id", (data) => {
            try {
                axiosInstance.post('/set-user-socket', {
                    user_id: data.user_id,
                    socket_id: socket.id
                });
            } catch (error) {
                console.error('[Error]', error);
            }
        });

        socket.on("driver-location", (data) => {
            axiosInstance
                .post('/driver-location', data)
                .then((response) => {
                    if (response.data.success === true) {
                        for (let msg of response.data.data) {
                            for (let socketId of msg.socket_ids) {
                                io.to(socketId)
                                    .emit(msg.channel, msg.data);
                            }
                        }
                    }
                })
                .catch((error) => {
                    console.error('[Error]', error.response.data);
                });
        });

        socket.on('disconnect', () => {
            try {
                axiosInstance.delete('/delete-user-socket', {
                    params: {
                        socket_id: socket.id
                    }
                });
            } catch (error) {
                console.error('[Error]', error);
            }
        });
    });

    server.listen(process.env.PORT, () => {
        console.log('listening on *:' + process.env.PORT);
    });
}
main();