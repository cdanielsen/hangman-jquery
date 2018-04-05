var WordList = require('../src/wordlist');
var _ = require('lodash');
var expect = require('expect.js');
var sinon = require('sinon');

describe('WordList', function() {

  /**
   * Testing (pseudo)randomness isn't really feasible. Here is a simple test that just
   * verifies that if Math.random() returns the same value, the same word is returned.
   */
  describe('#randomWord', function() {
    it('returns the same word if Math#random is the same value', function() {
      sinon.stub(Math, 'random').returns(0);

      var firstWord = WordList.randomWord();
      var secondWord = WordList.randomWord();

      // Make sure the word is correctly returned in uppercase format
      expect(firstWord.toUpperCase()).to.equal(firstWord);
      expect(secondWord.toUpperCase()).to.equal(secondWord);

      expect(firstWord).to.equal(secondWord);
    });
  });

  describe('#createArrayOfUnderscores', function() {
    it('throws an error if no length is provided', function() {
      expect(function() {
        WordList.createArrayOfUnderscores();
        expect.fail('Expected Error');
      }).to.throwError(/length must be provided/);
    });

    it('throws an error if the provided length is undefined', function() {
      expect(function() {
        WordList.createArrayOfUnderscores(undefined);
        expect.fail('Expected Error');
      }).to.throwError(/length must be number > 0/);
    });

    it('throws an error if the provided length is null', function() {
      expect(function() {
        WordList.createArrayOfUnderscores(null);
        expect.fail('Expected Error');
      }).to.throwError(/length must be number > 0/);
    });

    it('throws an error if the provided length is <= 0', function() {
      expect(function() {
        WordList.createArrayOfUnderscores(-1);
        expect.fail('Expected Error');
      }).to.throwError(/length must be number > 0/);

      expect(function() {
        WordList.createArrayOfUnderscores(0);
        expect.fail('Expected Error');
      }).to.throwError(/length must be number > 0/);
    });

    it('returns an Array of length 1 with a single underscore character when provided length is 1', function() {
      var size = 1;

      var arr = WordList.createArrayOfUnderscores(size);
      
      expect(arr.length).to.be(size);
      expect(arr[0]).to.be('_');
    });
  });

  describe('#matchedCharacterIndices', function() {
    var arr;
    var word = 'APPLE';
    var guess;

    it('throws an error if the word and currentMatches array lengths differ', function() {
      arr = [];
      guess = 'P';

      expect(function() {
        WordList.matchedCharacterIndices(word, guess, arr);
        expect.fail('Expected Error');
      }).to.throwError(/word and array lengths differ/);
    });

    it('is a no-op when the guessed character is not in the word', function() {
      arr = ['_', '_', '_', '_', '_'];
      guess = 'O';

      WordList.matchedCharacterIndices(word, guess, arr);

      expect(arr).to.eql(['_', '_', '_', '_', '_']);
    });

    it('does not overwrite an already revealed index with the same value as the guessed letter', function() {
      arr = ['_', 'P', '_', '_', '_'];
      guess = 'P';

      WordList.matchedCharacterIndices(word, guess, arr);

      expect(arr).to.eql(['_', 'P', 'P', '_', '_']);
    });

    it('throws an error if the guessed letter is replacing a non-underscore letter in the matched letters array', function() {
      arr = ['_', 'E', '_', '_', '_'];
      guess = 'P';

      expect(function() {
        WordList.matchedCharacterIndices(word, guess, arr);
      }).to.throwError(/Attempted to incorrectly replace E with P at index 1/);
    });

    it('replaces underscores with the guessed character in the matched letters array', function() {
      var arr = ['_', '_', '_', '_', '_'];
      guess = 'P';

      WordList.matchedCharacterIndices(word, guess, arr);

      expect(arr).to.eql(['_', 'P', 'P', '_', '_']);

      guess = 'E';

      WordList.matchedCharacterIndices(word, guess, arr);

      expect(arr).to.eql(['_', 'P', 'P', '_', 'E']);
    });
  });
});
