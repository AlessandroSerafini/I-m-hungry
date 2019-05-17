# I'm hungry

This project is developed by Alessandro Serafini (N.283058) for the final exam of the course of PIATTAFORME DIGITALI PER LA GESTIONE DEL TERRITORIO - A.A. 2018/2019

## About 

Find the best restaurants uploaded by users, based on criteria such as name and kind of food. You can consult data sheets and customer ratings about your favorite restaurant.

## Architecture description and implementation choices 

In order to use properly this service, you need to create two files:

**authConfig.js**
```
module.exports = {
    secretCookieValue:'your-secret-cookie-value',
    username:'your-admin-username',
    password:'your-admin-password'
};
````

and

**telegramConfig.js**
```
module.exports = { token:'your-telegram-token'};
````

### Database

The project is developed using Firebase Realtime Database which allows to store and sync data with our NoSQL cloud database. Data is synced across all clients in realtime, and remains available when your app goes offline.

### API Interface

For the realization of the API I have chosen to use NodeJs and Express, a minimal Node.js web application framework which provides a robust set of features, among which HTTP utility methods and middleware, which allows you to create a robust API quickly.

### Dependencies

* **body-parser**: Parse incoming request bodies in a middleware before your handlers, available under the `req.body` property.
* **firebase**: Lets you interact with firebase realtime database to store and query user data.
* **node-telegram-bot-api**: Node.js module to interact with official Telegram Bot API. A bot token is required and can be obtained by talking to @botfather.
* **@google/maps**: Node.js library used for the Google Maps Places APIs. See `External Services` section to more informations.
* **swagger-ui-express**: Adds middleware to your express app to serve the Swagger UI bound to your Swagger document.
* **swagger-jsdoc**: Enables you to integrate Swagger using JSDoc comments in your code.

### External Services

#### Google Places API

The Places API is a service that returns information about places using HTTP requests. Places are defined within this API as establishments, geographic locations, or prominent points of interest.

In particular, the google places APIs have been used to retrieve restaurant data from name and location:

* **maps/api/place/findplacefromtext**: Used for retrieve restaurant `place_id` and `photos`, passing restaurant name and restaurant city.
* **maps/api/place/details**: Used for retrieve the restaurant details data, such as `formatted_address`,`geometry`,`formatted_phone_number`,`name`,`rating`,`reviews`, passing `place_id`.
* **maps/api/place/photo**: Used to retrieve restaurant pic, passing `photoreference` (retrieved in first pic of `photos` data)

**NB:** Each of the services is accessed as an HTTP request, and returns either an JSON or XML response. All requests to a Places service must use the https:// protocol, and include an API key.

## Web client

![Restaurant map](https://i.ibb.co/ZcBcs8Z/Schermata-2019-05-16-alle-16-20-02.png)

![Sign in](https://i.ibb.co/C80kxMH/Schermata-2019-05-16-alle-16-20-14.png)

![Restaurant admin list](https://i.ibb.co/3vRnstZ/Schermata-2019-05-16-alle-16-20-31.png)

![Edit restaurant](https://i.ibb.co/jR3SnXN/Schermata-2019-05-16-alle-16-20-41.png)

The [web client](https://github.com/AlessandroSerafini/I-m-hungry-frontend) ([here the demo](https://uniurb.firebaseapp.com/)) allows you to consult the restaurants added by users through the use of a Google Map.

In addition to the map, a login panel is available: once authenticated it will be possible to handle restaurants entered by users, by adding them, modifying them or removing them.

## Telegram Bot

![](https://i.ibb.co/XCVgGn8/Senza-titolo-1.jpg)

You can also add, edit and delete restaurants using [Telegram bot](https://t.me/AleSerafiniBot) to keep the community alive!

## Documentation 

Check [I'm hungry wiki](https://github.com/AlessandroSerafini/I-m-hungry/wiki)

## Dependencies

In order to use the dependencies specified and include within the package.json file, you must run the `npm install` command.
