const TelegramBot = require('node-telegram-bot-api');
const telegramConfig = require("./telegramConfig");
const webService = require("./webService");

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
    bot.sendMessage(chatId, 'Sorry, I\'m not able to get restaurants', {
        reply_markup: {
            remove_keyboard: true
        }
    });
}

function sendAddErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to add the restaurant', {
        reply_markup: {
            remove_keyboard: true
        }
    });
}

function sendUpdateErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to update the restaurant', {
        reply_markup: {
            remove_keyboard: true
        }
    });
}

function sendDeleteErrorMessage(chatId) {
    bot.sendMessage(chatId, 'Sorry, I\'m not able to delete the restaurant', {
        reply_markup: {
            remove_keyboard: true
        }
    });
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

        let message = '<b>' + restaurant.name + '</b><br/>';
        let randomReviewIndex = Math.floor(Math.random() * restaurant.reviews.length);
        message += formatRestaurantStars(Math.round(restaurant.rating)) + '<br/>' +
            restaurant.formatted_address + '<br/>___________<br/>' +
            '<i>«' + restaurant.reviews[randomReviewIndex].text + ' - ' + restaurant.reviews[randomReviewIndex].author_name + '»</i>';
        bot.sendMessage(chatId, br2nl(message), {
            parse_mode: 'HTML', reply_markup: {
                remove_keyboard: true
            }
        });
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

function handleAddRestaurant(chatId, restaurantId = null) {
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
                                if (restaurantId !== null) {
                                    updateRestaurant(chatId, restaurantId, {
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
                callback_data: restaurant.id
            });
        });
        let matrix = listToMatrix(choices, 2);
        bot.sendMessage(chatId, 'Nice, what\'s the restaurant you want update?', {
            reply_markup: {
                inline_keyboard: matrix
            }
        }).then((payload) => {
            bot.once("callback_query", function onCallbackQuery(callbackQuery) {
                return bot.deleteMessage(payload.chat.id, payload.message_id).then(resp => {
                    let restaurantId = callbackQuery.data;
                    handleAddRestaurant(chatId, restaurantId);
                });
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
                callback_data: restaurant.id
            });
        });
        let matrix = listToMatrix(choices, 2);
        bot.sendMessage(chatId, 'Nice, what\'s the restaurant name you want delete?', {
            reply_markup: {
                inline_keyboard: matrix
            }
        }).then((payload) => {
            bot.once("callback_query", function onCallbackQuery(callbackQuery) {
                return bot.deleteMessage(payload.chat.id, payload.message_id).then(resp => {
                    let restaurantId = callbackQuery.data;
                    deleteRestaurant(chatId, restaurantId);
                });
            });
        });
    });
}


// GET METHODS

function getRestaurants(chatId, filterKey, filterValue) {
    return new Promise((resolve, reject) => {
        let path = '/restaurants';
        switch (filterKey) {
            case 'food':
                path += '?food=' + filterValue;
                break;
            case 'name':
                path += '?name=' + encodeURIComponent(filterValue);
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

function getFoods() {
    return new Promise((resolve, reject) => {
        let options = {
            baseUrl: 'i-am-hungry.glitch.me',
            path: '/foods',
            method: 'GET',
        };
        webService.getJSON(options).then((res) => {
            if (res.statusCode === 200) {
                resolve(res.obj);
            } else {
                reject();
            }
        }).catch(() => {
            reject();
        });
    });
}


// SET METHODS

function addRestaurant(chatId, newRestaurant) {
    let options = {
        baseUrl: 'i-am-hungry.glitch.me',
        path: '/addRestaurant',
        body: JSON.stringify(newRestaurant),
        method: 'PUT',
    };
    let isThereAnError = false;
    webService.getJSON(options).then((res) => {
        if (res.statusCode === 200) {
            bot.sendMessage(chatId, 'Restaurants added successfully! Give me five 🖐', {
                reply_markup: {
                    remove_keyboard: true
                }
            });
        } else {
            isThereAnError = true;
        }
    }).catch(() => {
        isThereAnError = true;
    });

    if (isThereAnError) {
        sendAddErrorMessage(chatId);
    }
}

function updateRestaurant(chatId, restaurantId, newData) {
    newData.bot = true;
    let options = {
        baseUrl: 'i-am-hungry.glitch.me',
        path: '/updateRestaurant/' + restaurantId,
        body: JSON.stringify(newData),
        method: 'POST',
    };
    let isThereAnError = false;
    webService.getJSON(options).then((res) => {
        if (res.statusCode === 200) {
            bot.sendMessage(chatId, 'Restaurants update successfully! Give me five 🖐', {
                reply_markup: {
                    remove_keyboard: true
                }
            });
        } else {
            isThereAnError = true;
        }
    }).catch(() => {
        isThereAnError = true;
    });
    if (isThereAnError) {
        sendUpdateErrorMessage(chatId);
    }
}

function deleteRestaurant(chatId, restaurantId) {
    let options = {
        baseUrl: 'i-am-hungry.glitch.me',
        path: '/deleteRestaurant/' + restaurantId,
        method: 'DELETE',
    };
    let isThereAnError = false;
    webService.getJSON(options).then((res) => {
        if (res.statusCode === 200) {
            bot.sendMessage(chatId, 'Restaurants removed successfully! Give me five 🖐', {
                reply_markup: {
                    remove_keyboard: true
                }
            });
        } else {
            isThereAnError = true;
        }
    }).catch(() => {
        isThereAnError = true;
    });
    if (isThereAnError) {
        sendDeleteErrorMessage(chatId);
    }
}


initCtaListening();
