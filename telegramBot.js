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




initCtaListening();