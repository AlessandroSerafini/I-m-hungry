const https = require('https');

module.exports = {
    getJSON: async function (options) {
        return new Promise((resolve, reject) => {
            const data = {
                host: options.baseUrl,
                port: 443,
                path: options.path,
                method: options.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        let req = https.request(data, function (res) {
            let output = '';
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                try {
                    let obj = JSON.parse(output);
                    resolve({
                        statusCode: res.statusCode,
                        obj: obj
                    });
                } catch (err) {
                    reject({
                        statusCode: 500,
                        obj: err.message
                    });
                }

            });
        });
        req.on('error', function (err) {
            reject({
                statusCode: 500,
                obj: err.message
            });
        });
        if ('body' in options) {
            req.write(options.body);
        }
        req.end();
    });
    }
};