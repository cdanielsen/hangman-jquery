"use strict";

var url = require('url');

var Hangman = require('./HangmanService');

module.exports.createGame = function createGame (req, res, next) {
  Hangman.createGame(req.swagger.params, res, next);
};

module.exports.deleteGame = function deleteGame (req, res, next) {
  Hangman.deleteGame(req.swagger.params, res, next);
};

module.exports.getGame = function getGame (req, res, next) {
  Hangman.getGame(req.swagger.params, res, next);
};

module.exports.guessLetter = function guessLetter (req, res, next) {
  Hangman.guessLetter(req.swagger.params, res, next);
};
