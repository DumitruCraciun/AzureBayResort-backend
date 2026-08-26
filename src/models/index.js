// backend/src/models/index.js
const User = require('./User');
const Room = require('./Room');
const Booking = require('./Booking');
const Review = require('./Review');

module.exports = {
    User,
    Room,
    Booking,
    Review
};