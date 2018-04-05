var fs = require('fs');
var _ = require('lodash');

var UNDERSCORE_CHAR = '_';

console.log('Reading list of words from "src/words.txt"');
var words = fs.readFileSync('src/words.txt').toString().split('\n');

/**
 * <p>
 * A singleton "class" for managing the server-side dictionary of words
 * available that the client could potentially pick from. The object
 * also provides helper method for managing the letters_matched array related
 * to guessing characters and updating the array when new guesses are made.
 * </p>
 * <p>
 * Ideally, a WordList is created once and managed via a HangManager object
 * rather than being required throughout an application.
 * </p>
 */
module.exports = {

  /**
   * <p>
   * Randomly selects a word read from {@value words} (which is populated
   * from the file {@code "src/words.txt"}) using {@link Math#random}. The
   * returned word is returned with all letters in uppercase format.
   * </p>
   *
   * @return (string) a word from the underlying dictionary.
   */
  randomWord: function() {
    var index = Math.floor(Math.random() * words.length);
    return words[index].toUpperCase();
  },

  /**
   * <p>
   * Returns an array of size {@code len}, where each entry in the array
   * contains the string {@code '_'}.
   * </p>
   *
   * @param len (number) the length of the returned array. Must be > 0
   * @return (array) of length {@code len} containing underscore characters
   */
  createArrayOfUnderscores: function(len) {
    if (arguments.length === 0) {
      throw new Error('length must be provided');
    }
    if (!len || len <= 0) {
      throw new Error('length must be number > 0');
    }

    return _.fill(Array(len), UNDERSCORE_CHAR);
  },

  /**
   * <p>
   * For each index in <code>word</code> where <code>guess</code> is found,
   * replace the underscore character at the same index in
   * {@code currentMatches}.
   * </p>
   * <p>
   * <strong>NOTE</strong>: The supplied array is modified in-place rather
   * than returning a new array.
   * </p>
   * <pre>
   * // Example: Set the guessed 'P' character in the array at indices 1 and 2
   * var arr = [ '_', '_', '_', '_', '_' ];
   * matchedCharacterIndices('APPLE', 'P', arr);
   * arr === [ '_', 'P', 'P', '_', '_' ]; // returns true
   * </pre>
   * </p>
   *
   * @param word (string) the game word
   * @param guess (string) the letter being guessed
   * @param currentMatches (array) an Array of individual characters found in
   *        game word that have been guessed correctly by the client. The
   *        guessed letter will be added to each index in this array that matches
   *        in the game word
   */
  matchedCharacterIndices: function(word, guess, currentMatches) {
    if (word.length !== currentMatches.length) {
      throw new Error('word and array lengths differ');
    }
    // Short circuit if the guessed letter isn't in the word
    var index = _.indexOf(word, guess);
    if (index < 0) {
      return;
    }

    for (var i = index; i !== -1; i = _.indexOf(word, guess, i + 1)) {
      if (currentMatches[i] === word[i]) {
        // The letter has already been identified in currentMatches. Continue
        // to the next index
        continue;
      }
      if (currentMatches[i] !== UNDERSCORE_CHAR) {
        // Safety check: make sure we're not trying to replace an already 
        // guessed character in currentMatches with the given guess character.
        // This may be a case of data corruption or better need for
        // transactional locks/checks with the current `nedb` implementation.
        var msg = 'Attempted to incorrectly replace ' + currentMatches[i] +
                  ' with ' + guess + ' at index ' + i;
        throw new Error(msg);
      }

      // Replace all underscore characters in currentMatches at the same index
      // the guessed character matches in the given word
      currentMatches[i] = guess;
    }
  }
};