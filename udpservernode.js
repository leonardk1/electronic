const dgram = require('dgram');
const mysql = require('mysql2');
const port = 11224;

// Create a UDP server
const server = dgram.createSocket('udp4');
let pumpStatus = "off", recv_ip = "0.0.0.0";

// Store the last received data for each unique ID
const lastReceivedData = {};

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: '68.183.146.206',       // Your database host
    user: 'iot',                  // Your MySQL username
    password: 'iot#device',       // Your MySQL password
    database: 'water_type',       // Your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to handle database queries
const executeQuery = (query, values, callback) => {
    pool.query(query, values, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
};

// Function to check if data has changed
const hasDataChanged = (uniqId, newData) => {
    const lastData = lastReceivedData[uniqId] || {};
    return Object.keys(newData).some(key => newData[key] !== lastData[key]);
};

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

    if (receivedData.uniq_id === "trans_0001" && ["on", "off", "urgent"].includes(receivedData.pump_status)) {
        if (hasDataChanged(receivedData.uniq_id, receivedData)) {
            // Update the last received data
            lastReceivedData[receivedData.uniq_id] = { ...receivedData };

            const query = 'INSERT INTO water_data (uniq_id, sale_daily, volume_daily, unit_monthly, pump_status) VALUES (?, ?, ?, ?, ?)';
            const values = [receivedData.uniq_id, receivedData.sale_daily, receivedData.volume_daily, receivedData.unit_monthly, receivedData.pump_status];

            if (receivedData.pump_status) {
                pumpStatus = receivedData.pump_status;
            }

            executeQuery(query, values, (err, result) => {
                if (err) {
                    console.error('Error inserting data:', err);
                } else {
                    console.log('Data inserted successfully:', result);
                }
            });
        } else {
            console.log('No changes detected. Data not updated.');
        }

        const responseObject = { response: "successfully", pump_state: pumpStatus };
        sendResponse(responseObject, rinfo);
    } else if (receivedData.uniq_id === "reciver_0001" && receivedData.reqst_type === "pump_request") {
        recv_ip = rinfo.address;
        const response_ = { user_ip: rinfo.address, pump_state: pumpStatus };
        sendResponse(response_, rinfo);
    } else {
        const response___ = { response: "failed!" };
        sendResponse(response___, rinfo);
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
