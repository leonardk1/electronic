const dgram = require('dgram');
const { Client } = require('pg');
const port = 3000;

// Create a UDP server
const server = dgram.createSocket('udp4');

// Function to handle database queries
const executeQuery = (values) => {

    const pgClient = new Client({
        user: 'ubuni',
        password: 'xWQA#l23*55d',
        host: '127.0.0.1',
        port: '5432',
        database: 'smart_meter_monitoring',
    });

    pgClient
        .connect()
        .then(() => {
            const insert = `INSERT INTO current_records(
                meter_number,longitude,latitude,
                voltage_ch1,current_ch1,power_ch1,energy_ch1,power_factor_ch1,
                voltage_ch2,current_ch2,power_ch2,energy_ch2,power_factor_ch2,
                voltage_ch3,current_ch3,power_ch3,energy_ch3,power_factor_ch3) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13, $14, $15, $16, $17, $18)`;

            
            pgClient.query(insert, values, (err, result) => {
                if (err) {
                    console.error('Error inserting data', err);
                } else {
                    console.log('Data inserted successfully');
                }

                pgClient.end();
            });
        })
        .catch((err) => {
            console.error('Error connecting to PostgreSQL database', err);
        });
};

// Function to handle messages
const handleData = (data, rinfo) => {
    console.log(`Server received: ${data} from ${rinfo.address}:${rinfo.port}`);

    let receivedData;
    try {
        receivedData = JSON.parse(data);

        const dbValues = [
            receivedData.meter_number,
            receivedData.longitude,
            receivedData.latitude,
            receivedData.ch1.voltage,
            receivedData.ch1.current,
            receivedData.ch1.power,
            receivedData.ch1.energy,
            receivedData.ch1.power_factor,
            receivedData.ch2.voltage,
            receivedData.ch2.current,
            receivedData.ch2.power,
            receivedData.ch2.energy,
            receivedData.ch2.power_factor,
            receivedData.ch3.voltage,
            receivedData.ch3.current,
            receivedData.ch3.power,
            receivedData.ch3.energy,
            receivedData.ch3.power_factor
        ]

        executeQuery(dbValues);

        const responseObject = { status: "success" };
        sendResponse(responseObject, rinfo);
    } catch (err) {
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
