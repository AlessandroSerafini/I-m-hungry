const webService = require("./webService");
const googleApiKey = 'AIzaSyBtIQBtYgekv6YnUfXFGK3La0vm6armidQ';
const authConfig = require('./authConfig');

module.exports = {
    printResponse: function (success = true, message = '') {
        return {
            success: success,
            message: message
        }
    },
    getGooglePlace: function (placeName = '', placeCity = '') {
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
    },
    getGooglePlacePhoto: function (reference) {
        return 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400' +
            '&photoreference=' + reference + '&key=' + googleApiKey;
    },
    getGooglePlaceDetails: function (placeId = ''){
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
    },
    completerestaurant: function (restaurant, restaurantFirebaseId) {
        return new Promise(function(resolve, reject) {
            module.exports.getGooglePlace(restaurant.name, restaurant.city).then((place) => {
                if (typeof place !== 'undefined') {
                    module.exports.getGooglePlaceDetails(place[0].place_id).then((placeDetails) => {
                        placeDetails.photoUrl = module.exports.getGooglePlacePhoto(place[0].photos[0].photo_reference);
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
    },
    attemptAuth: function (req, res) {
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
};
