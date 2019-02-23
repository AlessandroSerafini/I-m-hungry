const express = require('express');
const app = express();

const googleApiKey = 'AIzaSyBtIQBtYgekv6YnUfXFGK3La0vm6armidQ';
const webService = require("./webService");

const bodyParser = require('body-parser');

const firebase = require('firebase');
const admin = require('./firebaseConfig');

const authConfig = require('./authConfig');

const telegramBot = require('./telegramBot');

const restaurantPath = 'restaurants';
const foodsPath = 'foods';

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


function printResponse(success = true, message = '') {
    return {
        success: success,
        message: message
    }
}

function getGooglePlace(placeName = '', placeCity = '') {
    return new Promise((resolve, reject) => {
        let options = {
            baseUrl: 'maps.googleapis.com',
            path: '/maps/api/place/findplacefromtext/json?input=' + encodeURIComponent(placeName + ' ' + placeCity) + '&inputtype=textquery&fields=place_id,photos&key=' + googleApiKey,
            method: 'GET',
        };
        webService.getJSON(options)
        .then((res) => {
            resolve(res.obj.candidates);
        }).catch((err) => {
            reject(err);
        });
    });
}

function getGooglePlacePhoto(reference) {
    return 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400' +
        '&photoreference=' + reference + '&key=' + googleApiKey;
}

function getGooglePlaceDetails(placeId = '') {
    return new Promise((resolve, reject) => {
        let options = {
            baseUrl: 'maps.googleapis.com',
            path: '/maps/api/place/details/json?placeid=' + placeId + '&fields=formatted_address,geometry,formatted_phone_number,name,rating,reviews&key=' + googleApiKey,
            method: 'GET',
        };

    webService.getJSON(options)
        .then((res) => {
            resolve(res.obj.result);
        }).catch((err) => {
            reject(err);
        });
    });
}

function completerestaurant(restaurant, restaurantFirebaseId) {
    return new Promise(function(resolve, reject) {
        getGooglePlace(restaurant.name, restaurant.city).then((place) => {
            if (typeof place !== 'undefined') {
                getGooglePlaceDetails(place[0].place_id).then((placeDetails) => {
                    placeDetails.photoUrl = getGooglePlacePhoto(place[0].photos[0].photo_reference);
                    placeDetails.id = restaurantFirebaseId;
                    placeDetails.food = restaurant.food;
                    resolve(placeDetails);
                }).catch((err) => {
                    reject(err);
                });
            }
        }).catch((err) => {
            reject(err);
        });
    });
}

function attemptAuth(req, res) {
    if (req.headers.authorization == authConfig.secretCookieValue) {
        return true;
    }
    if (req.query.username && req.query.password) {
        if (req.query.username == authConfig.username && req.query.password == authConfig.password) {
            return true;
        }
    }
    return false;
}

// Root path: prints short instructions
app.get('/', function(req, res) {
    res.type('application/json')
        .send(printResponse(true, "Navigate to /" + restaurantPath + "/:id to get info about it"));
    return;
});

//Fetch foods instances
app.get('/' + foodsPath, async (req, res) => {
    try {
        let foodsReference = firebase.database().ref("/" + foodsPath + "/");
        //Attach an asynchronous callback to read the data
        foodsReference.on("value",
        function(snapshot) {
            let foods = [];
            snapshot.forEach(function(item) {
                foods.push(item.val());
            });
            res.json(foods);
            foodsReference.off("value");
            return;
        },
        function(errorObject) {
            res.type('application/json')
                .send(printResponse(false, "The read failed: " + errorObject.code));
            return;
        });
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});

//Fetch restaurants instances
app.get('/' + restaurantPath, async (req, res) => {
    try {
        let restaurantReference = firebase.database().ref("/" + restaurantPath + "/");

        if (req.query.food) {
            restaurantReference = restaurantReference.orderByChild("food").equalTo(req.query.food);
        }
        //Attach an asynchronous callback to read the data
        restaurantReference.on("value",
        function(snapshots) {
            let promises = [];
            for (var k in snapshots.val()) {
                if (snapshots.val().hasOwnProperty(k)) {
                    if (!req.query.name || (req.query.name && snapshots.val()[k].name.toLowerCase().includes(req.query.name.toLowerCase()))) {
                        promises.push(completerestaurant(snapshots.val()[k], k));
                    }
                }
            }
            Promise.all(promises).then((restaurants) => {
                res.json(restaurants);
                restaurantReference.off("value");
                return;
            }).catch((err) => {
                    console.log(err);
                restaurantReference.off("value");
                return;
            });
        },
        function(errorObject) {
                res.type('application/json')
                    .send(printResponse(false, "The read failed: " + errorObject.code));
                return;
            });
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});

//Sign in
app.get('/login', (req, res) => {
    try {
        if (attemptAuth(req, res)) {
            // Login successfully
            res.type('application/json')
                .send(printResponse(true, authConfig.secretCookieValue));
            return;
        }

        // Login error
        res.status(500)
            .type('application/json')
            .send(printResponse(false, 'Login failed'));
        return;
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});

//Fetch restaurant instance
app.get('/' + restaurantPath + '/:id', function(req, res) {
    try {
        let id = req.params.id;
        let referencePath = '/' + restaurantPath + '/' + id + '/';
        let restaurantReference = firebase.database().ref(referencePath);

        //Attach an asynchronous callback to read the data
        restaurantReference.on("value",
            function(snapshots) {
                res.json({
                    id: id,
                    city: snapshots.val().city,
                    food: snapshots.val().food,
                    name: snapshots.val().name
                });
                restaurantReference.off("value");
                return;
            },
            function(errorObject) {
                res.type('application/json')
                    .send(printResponse(false, "The read failed: " + errorObject.code));
                return;
            });

    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});

//Create new restaurant instance
app.put('/addRestaurant', function(req, res) {
    try {
        res.set('Cache-Control', 'no-store');
        if (attemptAuth(req, res)) {
            let city = req.body.city;
            let food = req.body.food;
            let name = req.body.name;

            // Get a unique key for a new restaurant.
            let newPostKey = firebase.database().ref().child(restaurantPath).push().key;

            let referencePath = '/' + restaurantPath + '/' + newPostKey + '/';
            let restaurantReference = firebase.database().ref(referencePath);
            restaurantReference.set({
                    city: city,
                    food: food,
                    name: name,
                },
                function(err) {
                    if (err) {
                        res.status(500)
                            .type('application/json')
                            .send(printResponse(false, "Data could not be saved." + err.message));
                        return;
                    } else {
                        res.type('application/json')
                            .send(printResponse(true, "Data saved successfully."));
                        return;
                    }
                });
            return;
        } else {
            res.status(403)
                .type('application/json')
                .send(printResponse(false, 'Login is required'));
            return;
        }
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});

//Update existing restaurant instance
app.post('/updateRestaurant/:id', function(req, res) {
    try {
        res.set('Cache-Control', 'no-store');
        if (attemptAuth(req, res)) {
            let id = req.params.id;
            let city = req.body.city;
            let food = req.body.food;
            let name = req.body.name;

            let referencePath = '/' + restaurantPath + '/' + id + '/';
            let restaurantReference = firebase.database().ref(referencePath);
            restaurantReference.update({
                    city: city,
                    food: food,
                    name: name,
                },
                function(err) {
                    if (err) {
                        res.status(500)
                            .type('application/json')
                            .send(printResponse(false, "Data could not be updated." + err.message));
                        return;
                    } else {

                        res.type('application/json')
                            .send(printResponse(true, "Data updated successfully."));
                        return;
                    }
                });
        } else {
            res.status(403)
                .type('application/json')
                .send(printResponse(false, 'Login is required'));
            return;
        }
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});

//Delete a restaurant instance
app.delete('/deleteRestaurant/:id', function(req, res) {
    try {
        res.set('Cache-Control', 'no-store');
        if (attemptAuth(req, res)) {
            let id = req.params.id;
            let referencePath = '/' + restaurantPath + '/' + id + '/';
            let restaurantReference = firebase.database().ref(referencePath).remove();
            res.type('application/json')
                .send(printResponse(true, "Data deleted successfully."));
            return;
        } else {
            res.status(403)
                .type('application/json')
                .send(printResponse(false, 'Login is required'));
            return;
        }
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
        return;
    }
});


const server = app.listen(process.env.PORT, function() {
    console.log("Connecting to client");
});
