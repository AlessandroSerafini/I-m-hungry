const TelegramBot = require('node-telegram-bot-api');
const telegramConfig = require("./telegramConfig");
const webService = require("./webService");
const googleApiKey = 'AIzaSyBtIQBtYgekv6YnUfXFGK3La0vm6armidQ';
const googleApiBaseUrl = 'maps.googleapis.com';
const googleMapsClient = require('@google/maps').createClient({
    key: googleApiKey
});

const bot = new TelegramBot(telegramConfig.token, {polling: true});


// UTILS METHODS

function listToMatrix(list, elementsPerSubArray) {
    var matrix = [], i, k;

    for (i = 0, k = -1; i < list.length; i++) {
        if (i % elementsPerSubArray === 0) {
            k++;
            matrix[k] = [];
        }

        matrix[k].push(list[i]);
    }

    return matrix;
}

function br2nl(text) {
    return text.replace(/<br\s*\/?>/mg, "\n");
}

function sendGetErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to get restaurants');
}

function sendAddErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to add the restaurant');
}

function sendUpdateErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to update the restaurant');
}

function sendDeleteErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to delete the restaurant');
}

function sendOtherChoiceMessage(chatId) {
    bot.sendMessage(chatId, 'I\'m a bot, not a human 🤖. Please give me the informations I need.', {
        reply_markup: {
            remove_keyboard: true
        }
    });
}

function formatRestaurantStars(numStars) {
    let stars = '';
    for (let i = 0; i < numStars; i++) {
        stars += '⭐️';
    }
    if (numStars === 5) {
        stars += '🔝';
    }
    return stars;
}

function sendPlaceDetailMessage(chatId, restaurants) {
    let restaurantLabel = restaurants.length > 1 ? 'restaurants' : 'restaurant';
    bot.sendMessage(chatId, '<b>I\'ve found ' + restaurants.length + ' ' + restaurantLabel + ' based on your criteria</b> 🍗🍟', {parse_mode: 'HTML'});
    restaurants.forEach((restaurant) => {
        let isThereAnError = false;
        getPlaceId(restaurant).then((placeId) => {
            getPlaceDetails(placeId).then((placeDetails) => {
                let message = '<b>' + placeDetails.name + '</b><br/>';
                let randomReviewIndex = Math.floor(Math.random() * placeDetails.reviews.length);
                message += formatRestaurantStars(Math.round(placeDetails.rating)) + '<br/>' +
                placeDetails.formatted_address + '<br/>___________<br/>' +
                '<i>«' + placeDetails.reviews[randomReviewIndex].text + ' - ' + placeDetails.reviews[randomReviewIndex].author_name + '»</i>';
                bot.sendMessage(chatId, br2nl(message), {
                    parse_mode: 'HTML', reply_markup: {
                        remove_keyboard: true
                    }
                });
            }).catch(() => {
                isThereAnError = true;
            });
        }).catch(() => {
            isThereAnError = true;
        });

        if (isThereAnError) {
            sendGetErrorMessage(chatId);
        }
    });
}

function initCtaListening() {
    bot.onText(/\/start/, (msg, match) => {
        bot.sendMessage(msg.chat.id, 'Hi! 👋 I am Alessandro Serafini\'s bot. I can show you some restaurants ' +
            'based on certain criteria. I am also able to add, update and delete existing ' +
            'restaurants.\n\nTest me, write me a message by typing /restaurants 🤙!' +
            ' \n');
        });
        bot.onText(/\/restaurants/, (msg, match) => {
            bot.sendMessage(msg.chat.id, 'Got it, what do you wanna do?', {
                reply_markup: {
                    keyboard: [[
                        {
                            text: 'Get restaurants',
                        },
                        {
                            text: 'Add new restaurant',
                        }],
                        [{
                            text: 'Update restaurant',
                        },
                            {
                                text: 'Delete restaurant',
                            }
                        ]]
                }
            }).then((payload) => {
            bot.once('message', (msg) => {
                let chatId = payload.chat.id;
                switch (msg.text) {
                    case 'Get restaurants':
                        handleGetRestaurants(chatId);
                        break;
                    case 'Add new restaurant':
                        handleAddRestaurant(chatId);
                        break;
                    case
                    'Update restaurant':
                        handleUpdateRestaurant(chatId);
                        break;
                    case
                    'Delete restaurant':
                        handleDeleteRestaurant(chatId);
                        break;
                    default:
                        sendOtherChoiceMessage(chatId);
                        break;
                }
            });
        });
    });
}


// HANDLE METHODS

function handleGetRestaurants(chatId) {
    bot.sendMessage(chatId, 'Nice, based on what criteria?', {
        reply_markup: {
            keyboard: [[
                {
                    text: 'By food',
                },
                {
                    text: 'By name',
                }
            ]]
        }
    }).then((payload) => {
        bot.once('message', (msg) => {
            switch (msg.text) {
                case 'By food':
                    getFoods().then((categories) => {
                        let choices = [];
                        categories.forEach((category) => {
                            choices.push({text: category.name});
                        });
                        let matrix = listToMatrix(choices, 2);
                        bot.sendMessage(chatId, 'So.. which kind of food?', {
                            reply_markup: {
                                keyboard: matrix
                            }
                        }).then((payload) => {
                            bot.once('message', (msg) => {
                                getRestaurants(chatId, 'food', msg.text).then((restaurants) => {
                                    sendPlaceDetailMessage(chatId, restaurants);
                                });
                            });
                        });
                    }).catch(() => {
                        sendGetErrorMessage(chatId);
                    });
                break;
                case 'By name':
                    bot.sendMessage(chatId, 'So.. What\'s the restaurant name?', {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    }).then((payload) => {
                        bot.once('message', (msg) => {
                            getRestaurants(chatId, 'name', msg.text).then((restaurants) => {
                                sendPlaceDetailMessage(chatId, restaurants);
                            });
                        });
                    });
                break;
                default:
                    sendOtherChoiceMessage(chatId);
                break;
            }
        });
    });
}

function handleAddRestaurant(chatId, restaurantName = null) {
    bot.sendMessage(chatId, 'Nice, what\'s the restaurant name?', {
        reply_markup: {
            remove_keyboard: true
        }
    }).then((payload) => {
        bot.once('message', (msg) => {
            let newRestaurantName = msg.text;
            bot.sendMessage(chatId, 'And.. in which city can I find it?').then((payload) => {
                bot.once('message', (msg) => {
                    let newRestaurantCity = msg.text;
                    getFoods().then((categories) => {
                        let choices = [];
                        categories.forEach((category) => {
                            choices.push({text: category.name});
                        });
                        let matrix = listToMatrix(choices, 2);
                        bot.sendMessage(chatId, 'So.. which kind of food?', {
                            reply_markup: {
                                keyboard: matrix
                            }
                        }).then((payload) => {
                            bot.once('message', (msg) => {
                                if (restaurantName !== null) {
                                    updateRestaurant(chatId, restaurantName, {
                                        name: newRestaurantName,
                                        city: newRestaurantCity,
                                        food: msg.text
                                    });
                                } else {
                                    addRestaurant(chatId, {
                                        name: newRestaurantName,
                                        city: newRestaurantCity,
                                        food: msg.text
                                    });
                                }
                            });
                        });
                    }).catch(() => {
                        sendGetErrorMessage(chatId);
                    });
                });
            });
        });
    });
}

function handleUpdateRestaurant(chatId) {
    getRestaurants(chatId).then((restaurants) => {
        let choices = [];
        restaurants.forEach((restaurant) => {
            choices.push({
                text: restaurant.name,
            });
        });
        let matrix = listToMatrix(choices, 2);
        bot.sendMessage(chatId, 'Nice, what\'s the restaurant name you want update?', {
            reply_markup: {
                keyboard: matrix
            }
        }).then((payload) => {
            bot.once('message', (msg) => {
                handleAddRestaurant(chatId, msg.text)
            });
        });
    });
}

function handleDeleteRestaurant(chatId) {
    getRestaurants(chatId).then((restaurants) => {
        let choices = [];
        restaurants.forEach((restaurant) => {
            choices.push({
                text: restaurant.name,
            });
        });
        let matrix = listToMatrix(choices, 2);
        bot.sendMessage(chatId, 'Nice, what\'s the restaurant name you want delete?', {
            reply_markup: {
                keyboard: matrix
            }
        }).then((payload) => {
            bot.once('message', (msg) => {
                deleteRestaurant(chatId, msg.text);
            });
        });
    });
}


// GET METHODS FROM GOOGLE

function getPlaceId(restaurant) {
    return new Promise((resolve, reject) => {
        let options = {
            baseUrl: googleApiBaseUrl,
            path: '/maps/api/place/findplacefromtext/json?input=' + encodeURIComponent(restaurant.name + ' ' + restaurant.city) + '&inputtype=textquery&fields=place_id&key=' + googleApiKey,
            method: 'GET',
        };
        webService.getJSON(options).then((res) => {
            if (res.statusCode === 200) {
                let candidates = res.obj.candidates;
                if (candidates.length > 0) {
                    let placeId = candidates[0].place_id;
                    resolve(placeId);
                } else {
                    reject();
                }
            } else {
                reject();
            }
        }).catch(() => {
            reject();
        });
    });
}

function getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
        let options = {
            baseUrl: googleApiBaseUrl,
            path: '/maps/api/place/details/json?placeid=' + placeId + '&fields=name,formatted_address,rating,url,reviews&key=' + googleApiKey,
            method: 'GET',
        };
        webService.getJSON(options).then((res) => {
            if (res.statusCode === 200) {
                resolve(res.obj.result);
            } else {
                reject();
            }
        }).catch(() => {
            reject();
        });
    });
}


// GET METHODS

function getRestaurants(chatId, filterKey, filterValue, equalTo = false) {
    return new Promise((resolve, reject) => {
        //TODO: il messaggio di errore non sta venendo mandato
        let path = '/restaurants';
        switch (filterKey) {
            case 'food':
                path += '?food=' + filterValue;
                break;
            case 'name':
                path += '?name=' + encodeURIComponent(filterValue);
                if (equalTo) {
                    path += '&equalTo=1';
                }
                break;
            default:
                break;
        }
        let options = {
            baseUrl: 'i-am-hungry.glitch.me',
            path: path,
            method: 'GET',
        };
        let isThereAnError = false;
        webService.getJSON(options).then((res) => {
            if (res.statusCode === 200) {
                let restaurants = res.obj;
                if (restaurants.length > 0) {
                    resolve(restaurants);
                } else {
                    bot.sendMessage(chatId, 'I\'m sorry, I didn\'t found any restaurant 😔', {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }
            } else {
                isThereAnError = true;
            }
        }).catch(() => {
            isThereAnError = true;
        });
        if (isThereAnError) {
            sendGetErrorMessage(chatId);
            reject();
        }
    });
}




initCtaListening();