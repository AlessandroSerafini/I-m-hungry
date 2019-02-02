const TelegramBot = require('node-telegram-bot-api');
const telegramConfig = require("./telegramConfig");
const webService = require("./webService");
const googleApiKey = 'AIzaSyBtIQBtYgekv6YnUfXFGK3La0vm6armidQ';
const googleApiBaseUrl = 'maps.googleapis.com';
const googleMapsClient = require('@google/maps').createClient({
    key: googleApiKey
});

const bot = new TelegramBot(telegramConfig.token, {polling: true});