const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const firebase = require('firebase');
const admin = require('./firebaseConfig');

const telegramBot = require('./telegramBot');

const restaurantPath = 'restaurants';
const foodsPath = 'foods';