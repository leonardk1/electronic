import dgram from "dgram"
import fetch from "node-fetch"

const port = 3000;

// Create a UDP server
const server = dgram.createSocket('udp4');

// Function to handle messages

const handleData = async (data, rinfo) => {
  console.log(`Server received: ${data} from ${rinfo.address}:${rinfo.port}`);

  let receivedData;
  try {
    receivedData = JSON.parse(data);

    const dataPoint = {

      current_record: {
        meter_number: receivedData.meter_number,
        longitude: receivedData.longitude,
        latitude: receivedData.latitude,
        voltage_ch1: receivedData.ch1.voltage,
        current_ch1: receivedData.ch1.current,
        power_ch1: receivedData.ch1.power,
        energy_ch1: receivedData.ch1.energy,
        power_factor_ch1: receivedData.ch1.power_factor,
        voltage_ch2: receivedData.ch2.voltage,
        current_ch2: receivedData.ch2.current,
        power_ch2: receivedData.ch2.power,
        energy_ch2: receivedData.ch2.energy,
        power_factor_ch2: receivedData.ch2.power_factor,
        voltage_ch3: receivedData.ch3.voltage,
        current_ch3: receivedData.ch3.current,
        power_ch3: receivedData.ch3.power,
        energy_ch3: receivedData.ch3.energy,
        power_factor_ch3: receivedData.ch3.power_factor
      }
    }

    const response = await fetch("http://143.110.244.181/app/current_records", {
      method: "POST",
      body: JSON.stringify(dataPoint),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });

    const responseData = await response.json()

    console.log('DATA FROM RAILS')
    console.log(responseData)

    const responseObject = { status: "success" };
    sendResponse(responseObject, rinfo);
  } catch (err) {
    console.log(err)
    console.error('Invalid JSON received:', data);
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
