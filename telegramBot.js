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