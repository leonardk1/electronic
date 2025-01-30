const dgram = require('dgram');
const port = 3000;

// Create a UDP server
const server = dgram.createSocket('udp4');

// Store the last received data for each unique ID
const lastReceivedData = {};





// Function to handle messages
const handleMessage = (msg, rinfo) => {
    console.log(`Server received: ${msg} from ${rinfo.address}:${rinfo.port}`);

    let receivedData;
    try {
        receivedData = JSON.parse(msg);
    } catch (err) {
        console.error('Invalid JSON received:', msg);
        return;
    }

    console.log(receivedData)

};


// Event listener for incoming messages
server.on('message', handleMessage);

// Event listener for server errors
server.on('error', (err) => {
    console.error(`Server error:\n${err.stack}`);
    server.close();
});

// Start listening
server.bind(port, () => {
    console.log(`UDP server listening on port ${port}`);
});
