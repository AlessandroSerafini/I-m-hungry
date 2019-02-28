const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const telegramBot = require('./telegramBot');
const swaggerJsdoc = require('swagger-jsdoc');
const options = {
    swaggerDefinition: {
        info: {
            title: 'I\'m hungry',
            version: '1.0.0',
            description: 'Find the best restaurants uploaded by users, based on criteria such as name and kind of food. You can consult data sheets and customer ratings about your favorite restaurant. You can also add, edit and delete restaurants using telegram bot @AleSerafiniBot to keep the community alive!',
            contact: {
                name: 'Alessandro Serafini',
                email: 'a.serafini21@campus.uniurb.it'
            },
            'license': {
                name: 'Apache 2.0',
                url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
            }
        }
    },
    apis: ['endpoints.js'],
};

const specs = swaggerJsdoc(options);
const swaggerUi = require('swagger-ui-express');




app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    if ("OPTIONS" == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

require('./endpoints')(app);

const server = app.listen(process.env.PORT, function() {
    console.log("Connecting to client");
});
