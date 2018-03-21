const irc = require('irc');
const fs = require('fs');

const parser = require('./parser.js');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Create the bot
var bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

// This should be done as soon as the bot is created to prevent it from crashing
bot.addListener('error', function(message) {
    console.log('Error: ', message);
});

bot.addListener('message', function(from, to, message) {
    // Listen for the '!'
    if (message.substring(0, 1) == '!') {
        // The formula is everything after '!'
        var formula = message.substring(1, message.length);
        var result = parser.parse(formula);
        bot.say(to, from + ', ' + result);
    }
});
