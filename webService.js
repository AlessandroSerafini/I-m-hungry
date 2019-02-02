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

                } catch (err) {

                }

            });
        });
        req.on('error', function (err) {

        });
        if ('body' in options) {
            req.write(options.body);
        }
        req.end();
    });
    }
};