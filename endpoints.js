const firebase = require('firebase');
const admin = require('./firebaseConfig');
const authConfig = require('./authConfig');
const methodsService = require("./methodsService");


module.exports = function (app) {
    /**
     * @swagger
     *
     * securityDefinitions:
     *   APIKeyHeader:
     *     type: apiKey
     *     in: header
     *     name: Authorization
     * tags:
     * - name: "food"
     *   description: "Everything about kinds of food"
     * - name: "restaurants"
     *   description: "Access to Restaurants"
     * - name: "user"
     *   description: "Operations about user"
     * definitions:
     *   Food:
     *     type: object
     *     required:
     *       - name
     *     properties:
     *       name:
     *         type: string
     *         example: Sushi
     *   Restaurant:
     *     type: object
     *     required:
     *       - name
     *       - city
     *       - food
     *     properties:
     *       name:
     *         type: string
     *         example: Kimiama
     *       city:
     *         type: string
     *         example: Riccione
     *       food:
     *         type: string
     *         example: Sushi
     *   GoodResponse:
     *     type: object
     *     required:
     *       - success
     *       - message
     *     properties:
     *       success:
     *         type: boolean
     *         example: true
     *       message:
     *         type: string
     *         example: Operation complete succesfully
     *   BadResponse:
     *     type: object
     *     required:
     *       - success
     *       - message
     *     properties:
     *       success:
     *         type: boolean
     *         example: false
     *       message:
     *         type: string
     *         example: Bad response
     *   UnauthorizedResponse:
     *     type: string
     *     example: Unauthorized
     *   Location:
     *     type: object
     *     properties:
     *       lat:
     *         type: number
     *         format: double
     *         example: 44.005249
     *       lng:
     *         type: number
     *         format: double
     *         example: 12.653451
     *   Review:
     *     type: object
     *     properties:
     *       author_name:
     *         type: string
     *         example: Dario Dellino
     *       author_url:
     *         type: string
     *         example: https://www.google.com/maps/contrib/107350202176589664301/reviews
     *       language:
     *         type: string
     *         example: it
     *       profile_photo_url:
     *         type: string
     *         example: https://lh5.googleusercontent.com/-Fts_BA1oJbA/AAAAAAAAAAI/AAAAAAAAAAA/ACevoQPgsx59erA9cWFxl47mpt2zT9jzhw/s128-c0x00000000-cc-rp-mo-ba4/photo.jpg
     *       rating:
     *         type: number
     *         format: float
     *         example: 5
     *       relative_time_description:
     *         type: string
     *         example: a month ago
     *       text:
     *         type: string
     *         example: Ottima pizza... Personale molto gentile... Attesa per tre posti non prenotati veramente breve.. Complimenti alla prossima!
     *       time:
     *         type: string
     *         format: timestamp
     *         example: 1532819281
     *   CompleteRestaurant:
     *     type: object
     *     required:
     *       - id
     *       - name
     *       - food
     *     properties:
     *       formatted_address:
     *         type: string
     *         example: Viale Tasso, 21/A, 47838 Riccione RN
     *       formatted_phone_number:
     *         type: string
     *         example: 0541 697463
     *       geometry:
     *         type: object
     *         properties:
     *           location:
     *             $ref: '#/definitions/Location'
     *           viewport:
     *             type: object
     *             properties:
     *               northeast:
     *                 $ref: '#/definitions/Location'
     *               southwest:
     *                 $ref: '#/definitions/Location'
     *       name:
     *         type: string
     *         example: Kimiama
     *       rating:
     *         type: float
     *         example: 4.5
     *       reviews:
     *         type: array
     *         items:
     *           $ref: '#/definitions/Review'
     *       photoUrl:
     *         type: string
     *         example: https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=CmRaAAAASbjvYRmGkcGrk6MeJS6kxP4Rf1QUQuTHia9mE3tMsKVfqLOjo6-0ChvBw3PF5SXdVjx9cvFjks2BJePHC5hS8tul-6wO_91bBvh3eheRqf4FhwjhoXPHOIUIYC4K77F2EhA6MV6Uq6LCk3W2l02llvQ4GhRVAyug3F7eU6MSSBuTzzrMzMl1sQ&key=AIzaSyBtIQBtYgekv6YnUfXFGK3La0vm6armidQ
     *       id:
     *         type: string
     *         example: -Lf08RT9xUfEWLF9Z7IU
     *       food:
     *         type: string
     *         example: Sushi
     */

    app.get('/', async (req, res) => {
        res.sendStatus(200)
            .type('application/json');
        return;
    });

    /**
     * @swagger
     *
     * /foods:
     *   get:
     *     tags:
     *     - "food"
     *     description: Fetch foods instances
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/Food'
     *       400:
     *         description: error
     *         schema:
     *           items:
     *             $ref: '#/definitions/BadResponse'
     */
    app.get('/foods', async (req, res) => {
        try {
            let foodsReference = firebase.database().ref("/foods/");
            foodsReference.on("value",
                function (snapshot) {
                    let foods = [];
                    snapshot.forEach(function (item) {
                        foods.push(item.val());
                    });
                    res.json(foods);
                    foodsReference.off("value");
                    return;
                },
                function (errorObject) {
                    res.status(400).json(methodsService.printResponse(false, "The read failed: " + errorObject.code)).end();
                    return;
                });
        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });

    /**
     * @swagger
     *
     * /restaurants:
     *   get:
     *     tags:
     *     - "restaurants"
     *     description: Fetch restaurants instances
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: query
     *         name: food
     *         description: Filters restaurants list by kind of food
     *         required: false
     *         type: string
     *       - in: query
     *         name: name
     *         description: Filters restaurants list by name. The specified name will be searched inside the restaurant name
     *         required: false
     *         type: string
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           type: array
     *           items:
     *             $ref: '#/definitions/CompleteRestaurant'
     *       400:
     *         description: error
     *         schema:
     *           items:
     *             $ref: '#/definitions/BadResponse'
     */
    app.get('/restaurants', async (req, res) => {
        try {
            let restaurantReference = firebase.database().ref("/restaurants/");

            if (req.query.food) {
                restaurantReference = restaurantReference.orderByChild("food").equalTo(req.query.food);
            }
            restaurantReference.on("value",
                function (snapshots) {
                    let promises = [];
                    for (var k in snapshots.val()) {
                        if (snapshots.val().hasOwnProperty(k)) {
                            if (!req.query.name || (req.query.name && snapshots.val()[k].name.toLowerCase().includes(req.query.name.toLowerCase()))) {
                                promises.push(methodsService.completerestaurant(snapshots.val()[k], k));
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
                function (errorObject) {
                    res.status(400).json(methodsService.printResponse(false, "The read failed: " + errorObject.code)).end();
                    return;
                });
        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });

    /**
     * @swagger
     *
     * /restaurants/{restaurantId}:
     *   get:
     *     tags:
     *     - "restaurants"
     *     description: Fetch restaurant details instance
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: path
     *         name: restaurantId
     *         description: Restaurant firebase id
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           type: object
     *           properties:
     *             id:
     *               type: string
     *               example: -Lf08RT9xUfEWLF9Z7IU
     *             city:
     *               type: string
     *               example: Riccione
     *             food:
     *               type: string
     *               example: Sushi
     *             name:
     *               type: string
     *               example: Kimiama
     *       400:
     *         description: error
     *         schema:
     *           items:
     *               $ref: '#/definitions/BadResponse'
     *       503:
     *         description: error
     */
    app.get('/restaurants/:id', function (req, res) {
        try {
            let id = req.params.id;
            let referencePath = '/restaurants/' + id + '/';
            let restaurantReference = firebase.database().ref(referencePath);

            //Attach an asynchronous callback to read the data
            restaurantReference.on("value",
                function (snapshots) {
                    if (snapshots.val()) {
                        res.json({
                            id: id,
                            city: snapshots.val().city,
                            food: snapshots.val().food,
                            name: snapshots.val().name
                        });
                    } else {
                        res.status(400).json(methodsService.printResponse(false, "Restaurant not found")).end();
                    }
                    restaurantReference.off("value");
                    return;
                },
                function (errorObject) {
                    res.status(400).json(methodsService.printResponse(false, "The read failed: " + errorObject.code)).end();
                    return;
                });

        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });

    /**
     * @swagger
     *
     * /addRestaurant:
     *   put:
     *     security:
     *       - APIKeyHeader: []
     *     tags:
     *     - "restaurants"
     *     description: Create new restaurant instance
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: body
     *         name: restaurant
     *         description: Restaurant object
     *         required: false
     *         type: object
     *         schema:
     *           $ref: '#/definitions/Restaurant'
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           items:
     *               $ref: '#/definitions/GoodResponse'
     *       400:
     *         description: error
     *         schema:
     *           items:
     *               $ref: '#/definitions/BadResponse'
     *       401:
     *         description: unauthorized
     *         schema:
     *           items:
     *               $ref: '#/definitions/UnauthorizedResponse'
     */
    app.put('/addRestaurant', function (req, res) {
        try {
            res.set('Cache-Control', 'no-store');
            if (methodsService.attemptAuth(req, res)) {
                let city = req.body.city;
                let food = req.body.food;
                let name = req.body.name;

                // Get a unique key for a new restaurant.
                let newPostKey = firebase.database().ref().child('restaurants').push().key;

                let referencePath = '/restaurants/' + newPostKey + '/';
                let restaurantReference = firebase.database().ref(referencePath);
                restaurantReference.set({
                        city: city,
                        food: food,
                        name: name,
                    },
                    function (err) {
                        if (err) {
                            res.status(400).json(methodsService.printResponse(false, "Data could not be saved." + err.message)).end();
                            return;
                        } else {
                            res.status(200).json(methodsService.printResponse(true, "Data saved successfully.")).end();
                            return;
                        }
                    });
                return;
            } else {
                res.status(401).json(methodsService.printResponse(false, "Login is required")).end();
                return;
            }
        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });


    /**
     * @swagger
     *
     * /updateRestaurant/{restaurantId}:
     *   post:
     *     security:
     *       - APIKeyHeader: []
     *     tags:
     *     - "restaurants"
     *     description: Update existing restaurant instance
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: path
     *         name: restaurantId
     *         description: Restaurant firebase id
     *         required: true
     *         type: string
     *       - in: body
     *         name: restaurant
     *         description: Restaurant object
     *         required: false
     *         type: object
     *         schema:
     *           $ref: '#/definitions/Restaurant'
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           items:
     *               $ref: '#/definitions/GoodResponse'
     *       400:
     *         description: error
     *         schema:
     *           items:
     *               $ref: '#/definitions/BadResponse'
     *       401:
     *         description: unauthorized
     *         schema:
     *           items:
     *               $ref: '#/definitions/UnauthorizedResponse'
     */
    app.post('/updateRestaurant/:id', function (req, res) {
        try {
            res.set('Cache-Control', 'no-store');
            if (methodsService.attemptAuth(req, res)) {
                let id = req.params.id;
                let city = req.body.city;
                let food = req.body.food;
                let name = req.body.name;

                let referencePath = '/restaurants/' + id + '/';
                let restaurantReference = firebase.database().ref(referencePath);
                restaurantReference.update({
                        city: city,
                        food: food,
                        name: name,
                    },
                    function (err) {
                        if (err) {
                            res.status(400).json(methodsService.printResponse(false, "Data could not be updated." + err.message)).end();
                            return;
                        } else {
                            res.status(200).json(methodsService.printResponse(true, "Data updated successfully.")).end();
                            return;
                        }
                    });
            } else {
                res.status(401).json(methodsService.printResponse(false, "Login is required")).end();
                return;
            }
        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });


    /**
     * @swagger
     *
     * /deleteRestaurant/{restaurantId}:
     *   delete:
     *     security:
     *       - APIKeyHeader: []
     *     tags:
     *     - "restaurants"
     *     description: Delete a restaurant instance
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: path
     *         name: restaurantId
     *         description: Restaurant firebase id
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           items:
     *               $ref: '#/definitions/GoodResponse'
     *       400:
     *         description: error
     *         schema:
     *           items:
     *               $ref: '#/definitions/BadResponse'
     *       401:
     *         description: unauthorized
     *         schema:
     *           items:
     *               $ref: '#/definitions/UnauthorizedResponse'
     */
    app.delete('/deleteRestaurant/:id', function (req, res) {
        try {
            res.set('Cache-Control', 'no-store');
            if (methodsService.attemptAuth(req, res)) {
                let id = req.params.id;
                let referencePath = '/restaurants/' + id + '/';
                firebase.database().ref(referencePath).remove();
                res.status(200).json(methodsService.printResponse(true, "Data deleted successfully.")).end();
                return;
            } else {
                res.status(401).json(methodsService.printResponse(false, "Login is required")).end();
                return;
            }
        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });


    /**
     * @swagger
     *
     * /login:
     *   get:
     *     tags:
     *     - "user"
     *     description: Return the secret cookie value
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: query
     *         name: username
     *         description: Username
     *         required: true
     *         type: string
     *       - in: query
     *         name: password
     *         description: Password
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: success
     *         schema:
     *           type: object
     *           required:
     *             - success
     *             - message
     *           properties:
     *             success:
     *               type: boolean
     *               example: true
     *             message:
     *               type: string
     *               example: abcde12345
     *       400:
     *         description: error
     *         schema:
     *           items:
     *               $ref: '#/definitions/BadResponse'
     */
    app.get('/login', (req, res) => {
        try {
            if (methodsService.attemptAuth(req, res)) {
                // Login successfully
                res.status(200).json(methodsService.printResponse(true, authConfig.secretCookieValue)).end();
                return;
            }

            // Login error
            res.status(400).json(methodsService.printResponse(false, "Login failed")).end();
            return;
        } catch (err) {
            res.status(400).json(methodsService.printResponse(false, err.message)).end();
            return;
        }
    });

}
