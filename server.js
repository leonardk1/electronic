const dgram = require('dgram');
const port = 3000;

// Create a UDP server
const server = dgram.createSocket('udp4');

// Function to handle messages
const handleMessage = (msg, rinfo) => {
    console.log(`Server received: ${msg} from ${rinfo.address}:${rinfo.port}`);

    let receivedData;
    try {
        receivedData = JSON.parse(msg);
        const responseObject = { status: "success" };
        sendResponse(responseObject, rinfo);
    } catch (err) {
        console.error('Invalid JSON received:', msg);
        const responseObject = { status: "failed" };
        sendResponse(responseObject, rinfo);
        return;
    }

    console.log(receivedData)

};

// Function to send a response
const sendResponse = (response, rinfo) => {
    server.send(JSON.stringify(response), rinfo.port, rinfo.address, (err) => {
        if (err) {
            console.error('Error sending response:', err);
        } else {
            console.log('Response sent:', JSON.stringify(response));
        }
    });
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
