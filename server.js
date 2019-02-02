const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const firebase = require('firebase');
const admin = require('./firebaseConfig');

const telegramBot = require('./telegramBot');

const restaurantPath = 'restaurants';
const foodsPath = 'foods';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

function printResponse(success = true, message = '') {
    return {success: success, message: message}
}

// Root path: prints short instructions
app.get('/', function (req, res) {
    res.type('application/json')
        .send(printResponse(true, "Navigate to /" + restaurantPath + "/:id to get info about it"));
});

//Fetch foods instances
app.get('/' + foodsPath, async (req, res) => {
    try {
        let foodsReference = firebase.database().ref("/" + foodsPath + "/");
        //Attach an asynchronous callback to read the data
        foodsReference.on("value",
        function (snapshot) {
            let foods = [];
            snapshot.forEach(function (item) {
                foods.push(item.val());
            });
            res.json(foods);
            foodsReference.off("value");
        },
        function (errorObject) {
            res.type('application/json')
                .send(printResponse(false, "The read failed: " + errorObject.code));
        });
    } catch (err) {
        res.status(500)
        .type('application/json')
        .send(printResponse(false, err));
    }
});

//Fetch restaurants instances
app.get('/' + restaurantPath, async (req, res) => {
    try {
        let restaurantReference = firebase.database().ref("/" + restaurantPath + "/");
        if (req.query.food) {
            restaurantReference = restaurantReference.orderByChild("food").equalTo(req.query.food);
        }
        if (req.query.equalTo) {
            restaurantReference = restaurantReference.orderByChild("name").equalTo(req.query.name);
        }
        //Attach an asynchronous callback to read the data
        restaurantReference.on("value",
        function (snapshot) {
            let restaurants = [];
            snapshot.forEach(function (item) {
                if (req.query.name) {
                    if (req.query.equalTo) {
                        restaurants.push(Object.keys(snapshot.val())[0]);
                    } else {
                        if (item.val().name.toLowerCase().includes(req.query.name.toLowerCase())) {
                            restaurants.push(item.val());
                        }
                    }
                } else {
                    restaurants.push(item.val());
                }
            });
            res.json(restaurants);
            restaurantReference.off("value");
        },
        function (errorObject) {
            res.type('application/json')
                .send(printResponse(false, "The read failed: " + errorObject.code));
        });
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err));
    }
});






const server = app.listen(process.env.PORT, function () {
    console.log("Connecting to client");
});