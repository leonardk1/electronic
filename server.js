import dgram from "dgram"
import fetch from "node-fetch"
import 'dotenv/config'

const port = process.env.PORT;

// Create a UDP server
const server = dgram.createSocket('udp4');

// Function to handle messages
const handleData = async (data, rinfo) => {
  console.log(`Server received: ${data} from ${rinfo.address}:${rinfo.port}`);

  let receivedData;
  try {
    receivedData = JSON.parse(data);

    const response = await fetch(`http://${process.env.URL}/app/current_records`, {
      method: "POST",
      body: JSON.stringify({ current_records: receivedData }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    try {

      const responseData = await response.json()

      console.log('DATA FROM RAILS')
      console.log(responseData)

      let responseObject = { status: "success" };
      if (responseData.message === 'Record Not Saved') {
        responseObject = { status: "failed" }
      }

      sendResponse(responseObject, rinfo);
    } catch (err) {
      const responseObject = { status: "failed" };
      sendResponse(responseObject, rinfo);
    }

  } catch (err) {
    console.log(err)
    console.error('Invalid JSON received:', data);
    const responseObject = { status: "failed" };
    sendResponse(responseObject, rinfo);
    return;
  }

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
server.on('message', handleData);

// Event listener for server errors
server.on('error', (err) => {
  console.error(`Server error:\n${err.stack}`);
  server.close();
});

// Start listening
server.bind(port, () => {
  console.log(`UDP server listening on port ${port}`);
});
