var HangManager = require('../src/manager');
var WordList = require('../src/wordlist');
var _ = require('lodash');
var expect = require('expect.js');
var sinon = require('sinon');

var id = 'a5f7d100-1b1a-11e6-a710-b3cacfbc9a2b';
var word = 'APPLE';

var hangManager;
var db = {
  findOne: function(query, callback) {
    callback(err, doc);
  },
  insert: function(index, callback) {
    callback(err, doc);
  },
  update: function(index, doc, options, callback) {
    callback(err, doc);
  },
  remove: function(query, options, callback) {
    callback(err, doc);
  }
};

describe('HangManager', function() {
  beforeEach(function() {
    hangManager = new HangManager({
      db: db
    });
  });

  afterEach(function() {
    err = doc = null;
  });

  describe('constructor', function() {
    it('errors when no options are provided in the constructor', function() {
      expect(function() {
        new HangManager();
      }).to.throwError(/No \"db\" option included in the HangManager options/);
    });

    it('errors when no db option is provided in the constructor options', function() {
      expect(function() {
        new HangManager({});
      }).to.throwError(/No \"db\" option included in the HangManager options/);
    });
  });

  describe('#getGame', function() {
    it('errors when not enough arguments are passed', function() {
      expect(function() {
        hangManager.getGame();
      }).to.throwError(/Must provide game id to retrieve and callback/);
    });

    it('errors when a non-string game id is passed', function() {
      expect(function() {
        hangManager.getGame(123);
      }).to.throwError(/Must provide valid id string/);
    });

    it('returns a 500 error if a database error occurs', function() {
      var message = 'error';
      db.findOne = function(query, callback) {
        callback({
          message: message
        }, null);
      };

      hangManager.getGame(id, function(err) {
        expect(err.code).to.be(500);
        expect(err.message).to.be(message);
      });
    });

    it('returns a 404 if no corresponding game is found', function() {
      db.findOne = function(query, callback) {
        callback(null, null);
      };

      hangManager.getGame(id, function(err) {
        expect(err.code).to.be(404);
        expect(err.message).to.be('No game with ID "' + id + '" was found.');
      });
    });

    it('returns an object if a corresponding game is found', function() {
      db.findOne = function(query, callback) {
        callback(null, {
          game_id: id,
          word: word,
          is_game_over: false
        });
      };

      hangManager.getGame(id, function(err, doc) {
        expect(doc.game_id).to.be(id);
        expect(doc.is_game_over).to.be(false);
        expect(doc).to.not.have.property('word');
      });
    });

    it('returns an object with the game word if the found game is over', function() {
      db.findOne = function(query, callback) {
        callback(null, {
          game_id: id,
          word: word,
          is_game_over: true
        });
      };

      hangManager.getGame(id, function(err, doc) {
        expect(doc.game_id).to.be(id);
        expect(doc.is_game_over).to.be(true);
        expect(doc.word).to.be(word);
      });
    });
  });


  describe('#createGame', function() {
    var testWord = 'APPLE';
    var wordListMock;

    beforeEach(function() {
      wordListMock = sinon.mock(WordList);
      wordListMock.expects('randomWord').once().returns(testWord);
    });

    afterEach(function() {
      wordListMock.verify();

      wordListMock.restore();
    });

    it('errors if the database cannot insert a new game document', function() {
      var message = 'error';
      db.insert = function(doc, callback) {
        callback({
          message: message
        }, null);
      };

      hangManager.createGame(function(err) {
        expect(err.code).to.be(500);
        expect(err.message).to.be(message);
      });
    });

    it('returns a new game on successful insert into the database', function() {
      db.insert = function(doc, callback) {
        callback(null, doc);
      };

      hangManager.createGame(function(err, doc) {
        expect(err).to.be(null);

        expect(doc.game_id).to.be.a('string');
        expect(doc).to.not.have.property('word');
        expect(doc.word_length).to.be(testWord.length);
        expect(doc.letters_guessed).to.be.empty();
        expect(doc.letters_matched).to.eql(['_', '_', '_', '_', '_']);
        expect(doc.remaining_incorrect_guesses).to.be(6);
        expect(doc.is_game_over).to.be(false);
        expect(doc.is_winner).to.be(false);
      });
    });
  });

  describe('#guessLetter', function() {
    // TODO
  });

  describe('#deleteGame', function() {
    it('errors if there are not enough arguments', function() {
      expect(function() {
        hangManager.deleteGame();
      }).to.throwError(/Must provide game ID to retrieve and a callback\./);
    });

    it('errors if the provided ID is not a string', function() {
      expect(function() {
        hangManager.deleteGame(1, function() {});
      }).to.throwError(/Must provide valid string ID\./);
    });

    it('errors if the guess is not a string', function() {
      var message = 'error';
      db.remove = function(query, options, callback) {
        callback({
          message: message
        });
      };
      hangManager.deleteGame(id, function(err) {
        expect(err.code).to.be(500);
        expect(err.message).to.be(message);
      });
    });

    it('errors if no game matches the given ID', function() {
      db.remove = function(query, options, callback) {
        callback(null, 0);
      };
      hangManager.deleteGame(id, function(err) {
        expect(err.code).to.be(404);
        expect(err.message).to.be('No game with ID "' + id + '" was found.');
      });
    });

    it('errors if multiple games are removed with the same ID', function() {
      db.remove = function(query, options, callback) {
        callback(null, 2);
      };
      hangManager.deleteGame(id, function(err) {
        expect(err.code).to.be(500);
        expect(err.message).to.be('Removed multiple documents with ID "' + id + '"');
      });
    });

    it('returns an empty object if the request removes a game', function() {
      db.remove = function(query, options, callback) {
        callback(null, 1);
      };
      hangManager.deleteGame(id, function(err, result) {
        expect(err).to.be(null);
        expect(result).to.eql({});
      });
    });
  });
});