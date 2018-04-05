"use strict";

var uuid = require('node-uuid');
var _ = require('lodash');
var WordList = require('./wordlist');

/*
 * Incorrect Guess Limit. Increase or decrease to modify the difficulty.
 */
var INCORRECT_GUESS_LIMIT = 6;

/**
 * <p>
 * Returns a clone of the given {@code doc} with database metadata and the
 * game's word removed. The supplied document is not modified.
 * </p>
 * <p>
 * Fields that are omitted in the returned document:
 * <ul>
 *   <li>_id</li>
 *   <li>createdAt</li>
 *   <li>updatedAt</li>
 *   <li>word*</li>
 * </ul>
 * </p>
 * <p>
 * *If the doc is for a game that has ended (i.e., the property
 * {@code is_game_over} is set to {@code true}), the field {@code word} will
 * <strong>NOT</strong> be removed in order to provide the client with the word
 * that was being guessed.
 * </p>
 *
 * @param doc (object) the database document to convert to a "client-friendly"
 *                     document
 * @return (object) a clone of the supplied doc
 */
var clientFriendlyDoc = function(doc) {
  var fieldsToOmit = [
    '_id',
    'createdAt',
    'updatedAt'
  ];
  // If the game isn't over, don't include the word in the document sent to the
  // client
  if (!doc.is_game_over) {
    fieldsToOmit.push('word');
  }
  return _.omit(doc, fieldsToOmit);
};

/**
 * Creates an error object to return to callbacks provided to the various
 * HangManager methods. Each object includes a status code, message, and
 * (optionally) the original error message itself.
 *
 * @param code (number) the status code of the error message
 * @param message (string) a message indicating the error that occurred
 * @param err (object) the original cause of the err. Optional.
 */
var formatError = function(code, message, err) {
  return {
    code: code,
    message: message,
    err: err
  };
};

/**
 * The main "class" for executing business logic against client requests and
 * the persistence layer/database. A Manager provides general CRUD interaction
 * methods for reads and writes of various Hangman games:
 * <ul>
 * <li>{@code getGame}: retrieves a particular game instance.</li>
 * <li>{@code createGame}: creates a new Hangman game</li>
 * <li>{@code guessLetter}: attempts to guess a specific character of the word
       in a particular game</li>
 * <li>{@code deleteGame}: removes an existing game from the database</li>
 * </ul>
 * <p>
 * All games have the following fields present as a part of the full game
 * document:
 * <ul>
 * <li>_id: The database ID for the game. This field is not inteded to be
 *     exposed to the client.</li>
 * <li>game_id: The customer-facing ID of the game. Represented as a V1 UUID to
 *     uniquely identify the game record.</li>
 * <li>word: The Hangman word being guessed. This field should not be exposed to
 *     the client until the game is over.</li>
 * <li>word_length: The length of the word being guessed.</li>
 * <li>letters_guessed: An array of letters as strings that the client has
 *     already guessed.</li>
 * <li>letters_matched: An array of letters that match correctly-guessed letters
 *     gound in the game's word. The correctly-guessed letters are listed in the
 *     same index as in the word. An example of this can be seen in
 *     {link WordList#matchedCharacterIndices()}, which is responsible for
 *     identifying the matched letters. If all letters have been matched in this
 *     array, the game is over and the client wins the game.</li>
 * <li>remaining_incorrect_guesses: The remaining guesses left the client has.
 *     This value is decremented if the client guesses an incorrect letter--that
 *     is, if the client guesses a letter not present in the game's word, the
 *     remaining allowed guesses is decreased by one. If the number of guesses
 *     left reaches zero (0) before the word has been identified, the game is
 *     over and the client loses.</li>
 * <li>is_game_over: Boolean flag indicating if the game is in a terminal state.
 *     </li>
 * <li>is_winner: Boolean flag indicating if the client successfully won the
 *     game. This flag should only be considered if {@code is_game_over} is
 *     {@code true}</li>
 * </ul>
 * </p>
 * <p>
 * Each manager maintains database access--currently, each HangManager accepts
 * an initialized database that is used for performing CRUD operations against
 * known hangman games. The database should be passed in the options argument
 * as {@code db}. For this implementation, the database should be an instance
 * of the {@code nedb} database module.
 * </p>
 * <p>
 * All Manager methods take a callback as the final argument. Each method is run
 * asynchronously, and the callback is passed {@code (err, doc)} once completed.
 * If an error occurred, a {@code code} and {@code message} are passed, which
 * can be used in the service response back to the client. Otherwise, the doc is
 * the response payload to send to the client.
 * </p>
 *
 * @param options (object) any options to pass to the underlying {@code nedb}
 *                database implementation. A {@code db} option must be provided.
 * @throws Error if no database option is provided
 *
 * @see {link WordList#matchedCharacterIndices()}
 * @see {link https://github.com/louischatriot/nedb}
 */
var HangManager = function(options) {
  if (!options || !options.db) {
    throw new Error('No "db" option included in the HangManager options');
  }
  // Setting the database implementation from the options allows for easier
  // unit testing by "mocking" database interactions.
  this.db = options.db;
};

/**
 * <p>
 * Attempts to retrieve the game associated with the specified game ID. If no
 * game is found, an error is sent in the callback as a 404 to indicate no such
 * game exists, and the document passed is set to {@code null}.
 * </p>
 *
 * @param id (string) an identifier for a specific hangman game to retrieve
 * @returns (object) containing the game's properties, otherwise {@code null}
 *                   if no such game exists.
 * @throws (error) if no id is provided
 */
HangManager.prototype.getGame = function(id, callback) {
  if (arguments.length === 0) {
    throw new Error('Must provide game id to retrieve and callback');
  }
  if (typeof id !== 'string') {
    throw new Error('Must provide valid id string');
  }

  this.db.findOne({ game_id: id }, function(err, doc) {
    if (err) {
      callback(formatError(500, err.message, err), doc);
    } else if (doc === null) {
      var message = 'No game with ID "' + id + '" was found.';
      callback(formatError(404, message), null);
    } else {
      callback(null, clientFriendlyDoc(doc));
    }
  });
};

/**
 * Creates a new Hangman game and persists the game data to the database.
 * 
 * @param callback (function) a callback to be executed when the game data has
 *                 been saved to the database. The callback is passed
 *                 {@code (err, doc)}, where {@code err} is an object containing
 *                 a status code and error message, and {@code doc} is the game
 *                 document itself.
 */
HangManager.prototype.createGame = function(callback) {
  // Generate a time-based UUID. Using v4() will create a random UUID
  var id = uuid.v1();
  var word = WordList.randomWord();
  var len = word.length;
  var wordArr = WordList.createArrayOfUnderscores(len);

  var doc = {
    game_id: id,
    word: word,
    word_length: len,
    letters_guessed: [],
    letters_matched: wordArr,
    remaining_incorrect_guesses: INCORRECT_GUESS_LIMIT,
    is_game_over: false,
    is_winner: false
  };

  this.db.insert(doc, function(err) {
    if (err) {
      callback(formatError(500, err.message, err), null);
    } else {
      callback(null, clientFriendlyDoc(doc));
    }
  });
};

/**
 * <p>
 * Applies the client's guessed value to the Hangman game with the corresponding 
 * ID. If the guess is not a letter in the 26-character English alphabet, a 400
 * Bad Request is returned to the supplied callback as an error. If the game is
 * already over, the game document is returned as-is back to the client with the
 * flag {@code is_game_over} set to {@code true} to indicate to the client that
 * additional guesses will not be accepted.
 * </p>
 * <p>
 * Guesses for letters in the Hangman game word are checked first against the
 * list of already-guessed letters. If the letter being guessed has already been
 * guessed, the request is treated as a no-op, and the game document is returned
 * to the client.
 * </p>
 * <p>
 * Otherwise, the letter is checked against the game word. If the guessed letter
 * is present, the letter is revealed in the {@code letters_matched} array for
 * each location in the word the guessed letter is present. If the letter is not
 * a correct value, the number of incorrect guesses allowed is decremented, the
 * guessed letter is added to the {@code letters_guessed} array, and the updated
 * state is returned to the client.
 * </p>
 * <p>
 * If the current guess has revealed all letters, the game is over and both the
 * {@code is_game_over} and {@code is_winner} flags are set to {@code true} to
 * indicate the game is in a terminal state before being sent back to the
 * client.
 * </p>
 * <p>
 * When the game is over, the returned document to the client will contain the
 * game's word, in order to inform the client what the word being guessed was.
 * </p>
 * 
 * @param id (string) the game ID the client is guessing against
 * @param guess (string) the letter being guessed
 * @param callback (function) a callback to be executed when the game data has
 *                 been saved to the database. The callback is passed
 *                 {@code (err, doc)}, where {@code err} is an object containing
 *                 a status code and error message, and {@code doc} is the game
 *                 document itself.
 * @see {@link WordList#matchedCharacterIndices()}
 */
HangManager.prototype.guessLetter = function(id, guess, callback) {
  /*
   * Initial validation:
   * - The guess must be a string of length 1, where the letter is one of the
   *   26 characters in the English alphabet.
   */
  if (typeof guess !== 'string') {
    callback(formatError(400, 'Must provide string character guess.'), null);
    return;
  }
  if (guess.length !== 1) {
    callback(formatError(400, 'Must provide single character guess.'), null);
    return;
  }
  // For convenience and consistency, uppercase the guessed letter for use
  // through the remaining validation and business logic
  guess = guess.toUpperCase();
  if (!guess.match(/[A-Z]/)) {
    var message = 'Guess must be an English letter between A and Z.';
    callback(formatError(400, message), null);
    return;
  }

  var db = this.db;
  db.findOne({ game_id: id }, function(err, doc) {
    if (err) {
      callback(formatError(500, err.message, err), null);
      return;
    } else if (doc === null) {
      var message = 'No game with ID "' + id + '" was found.';
      callback(formatError(404, message), null);
      return;
    }

    // Verify that the client can still guess against the game. If not, simply
    // return the document back to the client with the is_game_over flag set
    // (which it should already be)
    if (doc.is_game_over) {
      callback(null, clientFriendlyDoc(doc));
      return;
    }

    // If the user has already guessed that letter, simply return the game
    // as-is rather than erroring to indicate no change.
    var lettersGuessed = doc.letters_guessed;
    if (_.indexOf(lettersGuessed, guess) !== -1) {
      callback(null, clientFriendlyDoc(doc));
      return;
    }

    // Add the guessed letter to the array of already guessed letters
    lettersGuessed.push(guess);
    
    var remaining = doc.remaining_incorrect_guesses;
    var lettersMatched = doc.letters_matched;

    var word = doc.word;
    var index = word.indexOf(guess);
    var guessFound = (index !== -1);
    if (!guessFound) {
      // Incorrect guess
      remaining -= 1;
      doc.remaining_incorrect_guesses = remaining;
      // If there are no more remaining guesses left and there are still
      // unknown letters, the game is over
      if (remaining <= 0 && lettersMatched.indexOf('_') >= 0) {
        doc.is_game_over = true;
        doc.is_winner = false;
      }
    } else {
      // Correct guess
      WordList.matchedCharacterIndices(word, guess, lettersMatched);
    }

    // The current guess revealed all letters of the game's word. Mark the game
    // as over and the client a winner
    if (remaining > 0 && lettersMatched.indexOf('_') === -1) {
      doc.is_game_over = true;
      doc.is_winner = true;
    }

    // This is the only call that could cause problems due to read-modify-write
    // access of the database.
    //
    // XXX: Investigate what alternative database implementations are
    // available that support transactions. The simplest may be a traditional
    // relational SQL database.
    db.update({ game_id: doc.game_id }, doc, {
      // This call should not be inserting a new record. If it is, it would
      // indicate the game was deleted in between the read-modify-write update
      upsert: false
    }, function(err, numAffected) {
      var message;
      if (err) {
        callback(formatError(500, err.message, err), null);
      } else if (numAffected === 0) {
        // If the game was removed before this update could occur, it's an issue
        // with lack of transactional support. This error differentiates between
        // a game not existing before the update (404) and a game not existing
        // when trying to update (500)
        message = 'No game was found with ID "' + doc.game_id +
                  '" to update.';
        callback(formatError(500, message), null);
      } else if (numAffected > 1) {
        // Multiple game documents were written with the same game ID, which
        // violates the database implementation's index property. This should
        // (ideally) never happen, as the createGame API would error with the
        // duplicate game ID first, but we should still watch for it here.
        message = 'More than one game was found with ID "' + doc.game_id +
                  '" to update!';
        callback(formatError(500, message), null);
      } else {
        callback(null, clientFriendlyDoc(doc));
      }
    });
  });
};

/**
 * Removes a Hangman game with the given ID from the backend. If the game was
 * successfully removed, an empty doc is passed to the supplied callback. If a
 * document was successfully removed, err will be {@code null}.
 * 
 * @param id (string) the ID of the game to remove
 * @param callback (function) a callback to be executed when the game data has
 *                 been removed from the database. The callback is passed
 *                 {@code (err, doc)}, where {@code err} is an object containing
 *                 a status code and error message (if present), and {@code doc}
 *                 is an empty object to indicate the document was removed.
 */
HangManager.prototype.deleteGame = function(id, callback) {
  if (arguments.length !== 2) {
    throw new Error('Must provide game ID to retrieve and a callback.');
  }
  if (typeof id !== 'string') {
    throw new Error('Must provide valid string ID.');
  }

  this.db.remove({ game_id: id }, {}, function(err, numRemoved) {
    var message;
    if (err) {
      // Database error. Potentially retryable
      callback(formatError(500, err.message, err), null);
    } else if (numRemoved === 1) {
      // Successfully removed the game
      callback(null, {});
    } else if (numRemoved === 0) {
      // No game found with corresponding id
      message = 'No game with ID "' + id + '" was found.';
      callback(formatError(404, message, null));
    } else {
      // Multiple game documents were written with the same game ID, which
      // violates the database implementation's index property. This should
      // (ideally) never happen, as the createGame API would error with the
      // duplicate game ID first, but we should still watch for it here.
      message = 'Removed multiple documents with ID "' + id + '"';
      callback(formatError(500, message), null);
    }
  });
};

module.exports = HangManager;
