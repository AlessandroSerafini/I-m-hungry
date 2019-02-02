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

        req.end();
    });
    }
};