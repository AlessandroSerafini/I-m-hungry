const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const firebase = require('firebase');
const admin = require('./firebaseConfig');

const telegramBot = require('./telegramBot');

const restaurantPath = 'restaurants';
const foodsPath = 'foods';

const secretCookieValue = '.yV[%#hK9z>X8GnxEA;.7LTA';

const cookieparser = require('cookie-parser');
app.use(cookieparser());

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


function printResponse(success = true, message = '') {
    return {
        success: success,
        message: message
    }
}

// Root path: prints short instructions
app.get('/', function (req, res) {
    res.type('application/json')
        .send(printResponse(true, "Navigate to /" + restaurantPath + "/:id to get info about it"));
});

//Fetch foods instances
app.get('/' + foodsPath, async(req, res) => {
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
        .send(printResponse(false, err.message));
}
});

//Fetch restaurants instances
app.get('/' + restaurantPath, async(req, res) => {
    try {
        let restaurantReference = firebase.database().ref("/" + restaurantPath + "/");

if (req.query.food) {
    restaurantReference = restaurantReference.orderByChild("food").equalTo(req.query.food);
}
//Attach an asynchronous callback to read the data
restaurantReference.on("value",
    function (snapshots) {
        let restaurants = [];

        for (var k in snapshots.val()) {
            if (snapshots.val().hasOwnProperty(k)) {

                if (req.query.name) {
                    if (snapshots.val()[k].name.toLowerCase().includes(req.query.name.toLowerCase())) {
                        restaurants.push({
                            id: k,
                            city: snapshots.val()[k].city,
                            food: snapshots.val()[k].food,
                            name: snapshots.val()[k].name
                        });
                    }
                } else {
                    restaurants.push({
                        id: k,
                        city: snapshots.val()[k].city,
                        food: snapshots.val()[k].food,
                        name: snapshots.val()[k].name
                    });
                }


            }
        }
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
        .send(printResponse(false, err.message));
}
});

//Sign in
app.get('/login', (req, res) => {
    try {
        if (attemptAuth(req, res)) {
            // Login successfully
            res.type('application/json')
                .send(printResponse(true, 'Login successfully'));
            return;
        }

        // Login error
        res.type('application/json')
            .send(printResponse(false, 'Login failed'));
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
    }
});

//Sign out
app.get('/logout', (req, res) => {
    try {
        res.clearCookie('logintoken').send(printResponse(true, 'You are logged out'));
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
    }
});

//Check if i'm logged in
function attemptAuth(req, res) {
    console.log("Cookies: " + JSON.stringify(req.cookies));

    if(req.cookies.logintoken == secretCookieValue) {
        return true;
    }

    if(req.query.username && req.query.password) {
        if(req.query.username == 'root' && req.query.password == 'root') {
            res.cookie('logintoken', secretCookieValue);
            return true;
        }
    }

    return false;
}

//Fetch restaurant instance
app.get('/' + restaurantPath + '/:id', function (req, res) {
    try {
        let id = req.params.id;
        let referencePath = '/' + restaurantPath + '/' + id + '/';
        let restaurantReference = firebase.database().ref(referencePath);

        //Attach an asynchronous callback to read the data
        restaurantReference.on("value",
            function (snapshots) {
                res.json({
                    id: id,
                    city: snapshots.val().city,
                    food: snapshots.val().food,
                    name: snapshots.val().name
                });
                restaurantReference.off("value");
            },
            function (errorObject) {
                res.type('application/json')
                    .send(printResponse(false, "The read failed: " + errorObject.code));
            });

    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
    }
});

//Create new restaurant instance
app.put('/addRestaurant', function (req, res) {
    try {
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
            function (err) {
                if (err) {
                    res.status(500)
                        .type('application/json')
                        .send(printResponse(false, "Data could not be saved." + err.message));
                } else {
                    res.type('application/json')
                        .send(printResponse(true, "Data saved successfully."));
                }
            });
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
    }
});

//Update existing restaurant instance
app.post('/updateRestaurant/:id', function (req, res) {
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
        function (err) {
            if (err) {
                res.status(500)
                    .type('application/json')
                    .send(printResponse(false, "Data could not be updated." + err.message));
            } else {
                res.type('application/json')
                    .send(printResponse(true, "Data updated successfully."));
            }
        });
});

//Delete a restaurant instance
app.delete('/deleteRestaurant/:id', function (req, res) {
    try {
        let id = req.params.id;
        let referencePath = '/' + restaurantPath + '/' + id + '/';
        let restaurantReference = firebase.database().ref(referencePath).remove();
        res.type('application/json')
            .send(printResponse(true, "Data deleted successfully."));
    } catch (err) {
        res.status(500)
            .type('application/json')
            .send(printResponse(false, err.message));
    }
});


const server = app.listen(process.env.PORT, function () {
    console.log("Connecting to client");
});
