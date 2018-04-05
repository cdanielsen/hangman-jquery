$(function() {
  "use strict";

  var currentGame = null;

  var MAX_FIGURE_COUNT = 6;

  // Assume no game is in progress when first loading the page
  disableGuessButtons(true);
  // Draw out the gallows
  drawHangman(0);

  /**
   * Repaints the full gallows, and some number of the hangman body based on
   * the value of figureCountToDraw. The value of figureCountToDraw should be
   * determined by MAX_FIGURE_COUNT - remaining_incorrect_guesses; the larger
   * the value, the more figures of the hangman are drawn.
   *
   * @param figureCountToDraw (number) the number of figures of the hangman
   *                                   to draw. Must be between 0 and 6.
   */
  function drawHangman(figureCountToDraw) {
    if (figureCountToDraw < 0 || figureCountToDraw > MAX_FIGURE_COUNT) {
      throw new Error('figureCountToDraw must be between 0 and ' + MAX_FIGURE_COUNT);
    }

    // Clear out the "canvas"
    $('#hangman').empty();

    // Build out the main rendering "canvas"
    var hangman = d3.select('#hangman')
        .append('svg:svg')
        .attr('width', 300)
        .attr('height', 300);

    // Draw the gallows within the "canvas"
    drawGallows(hangman);

    // The more figures to draw, the more cases in this switch-case statement
    // are executed.
    switch (figureCountToDraw) {
      case 6:
        // Right arm
        drawLine(hangman, 150, 115, 190, 100);
        /* falls through */
      case 5:
        // Left arm
        drawLine(hangman, 150, 115, 110, 100);
        /* falls through */
      case 4:
        // Right leg
        drawLine(hangman, 150, 175, 190, 190);
        /* falls through */
      case 3:
        // Left leg
        drawLine(hangman, 150, 175, 110, 190);
        /* falls through */
      case 2:
        // Body
        drawLine(hangman, 150, 100, 150, 175);
        /* falls through */
      case 1:
        // Head
        drawHead(hangman);
        /* falls through */
      default:
        break;
    }
  }

  /**
   * Draws all of the gallow lines in the game.
   *
   * @param hangman (object) the hangman D3 canvas for appending each SVG line
   *                         to
   */
  function drawGallows(hangman) {
    drawLine(hangman, 0, 275, 300, 275);
    drawLine(hangman, 25, 275, 25, 25);
    drawLine(hangman, 25, 25, 150, 25);
    drawLine(hangman, 150, 25, 150, 50);
  }

  /**
   * Draw the head of the stick figure.
   *
   * @param hangman (object) the hangman D3 canvas for appending the head to
   */
  function drawHead(hangman) {
    var head = hangman.append('g')
        .attr('transform', 'translate(' + 150 + ',' + 75 + ')');

    head.append('circle')
        .attr('class', 'figure')
        .attr('r', 25);
  }

  /**
   * Draws a line, either representing the gallows or part of the stick figure
   *
   * @param hangman (object) the hangman D3 canvas for appending the SVG line
   *                         to
   */
  function drawLine(hangman, x1, y1, x2, y2) {
    hangman.append('line')
      .attr('class', 'figure')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);
  }

  /**
   * Toggles whether or not the guess buttons (corresponding to each letter in
   * the 26-letter English alphabet) are disabled. If isDisabled is true, the
   * buttons are disabled.
   *
   * @param isDisabled (boolean) if true, disables all guess buttons in the UI
   */
  function disableGuessButtons(isDisabled) {
    var $buttons = $('.guess-btn');
    if (isDisabled) {
      $buttons.attr('disabled', 'disabled')
              .addClass('disabled');
    } else {
      $buttons.removeAttr('disabled')
              .removeClass('disabled');
    }
  }

  $('#new-game-button').click(onStartNewGame);

  function onStartNewGame() {
    if (currentGame !== null && !currentGame.is_game_over) {
      var startNew = confirm('A game is already in progress. Starting a new game will not save progress. Are you sure you want to start a new game?');
      if (!startNew) {
        return;
      }
    }

    $.post({
      url: '/hangman'
    }).done(function(data) {
      currentGame = data;
      
      // Enable all letter buttons for guessing characters
      disableGuessButtons(false);
      // Draw only the gallows
      drawHangman(0);
      // Display the current letters matched (which should be none)
      displayLetters(data.letters_matched);

    }).fail(function(xhr, error, status) {
      debug(xhr.responseText);
    });
  }

  // Prevent the form from trying to submit itself.
  // XXX: Remove the form element from the DOM completely?
  $('form').submit(function() {
    return false;
  });

  $('.guess-btn').click(onGuessButtonClicked);

  /**
   * When a guess button is clicked, submit the guess for the current game to
   * the server. When the game state is recalculated, the UI is updated here as
   * well to indicate any changes in the game.
   *
   * @param event (object) an event object passed to this method when evoked.
   *                       If called through a jQuery binding, this will be
   *                       a jQuery Event object
   */
  function onGuessButtonClicked(event) {
    // If the user attempts to guess a letter when no game is available, alert the user
    // and no-op
    if (currentGame === null) {
      alert('No game in progress. Press "New Game" to start');
      return;
    }

    // If the user attempts to guess a letter when the game is over, alert the user
    // and no-op
    if (currentGame.is_game_over) {
      alert('Game has already ended');
      return;
    }

    var $this = $(event.currentTarget);
    var guess = $this.val();
    // Disable the clicked button to show it has been guessed
    $this.addClass('disabled');
    $this.attr('disabled', 'disabled');

    $.ajax({
      url: '/hangman/' + currentGame.game_id,
      method: 'PUT',
      data: { guess: guess },
      dataType: 'json'
    }).done(function(data) {
      currentGame = data;

      // Repaint the SVG lines based on the remaining incorrect guesses the user has
      // The larger the number (6 - <remaining guesses>) is, the more lines are drawn
      drawHangman(MAX_FIGURE_COUNT - data.remaining_incorrect_guesses);

      var lettersMatched = data.letters_matched;
      // Check if the game is now over
      if (currentGame.is_game_over) {
        // Disable guess buttons to indicate this
        disableGuessButtons(true);

        // Highlight the letters based on if the user won or not and increment the
        // wins/losses score, respectively
        if (currentGame.is_winner) {
          displayLetters(lettersMatched, 'blue');
          increaseWinningScore();
        } else {
          displayGameWord(data.word);
          increaseLosingScore();
        }
      } else {
        // Otherwise, simply display what all of the guessed letters are now.
        displayLetters(lettersMatched);
      }
    }).fail(function(xhr, error, status) {
      debug(xhr.responseJSON && xhr.responseJSON.error);
    });
  }

  /**
   * Display each letter in the lettersMatched array in the DOM. Optionally, the
   * provided color value can be used to change the color of the letters displayed.
   * By default, all letters are colored black.
   *
   * @param lettersMatched (array) an array of individual letters that the user has
   * already guessed as part of the game word.
   * @param color (string) optional; the color of the displayed letters. Defaults to
   *                       black
   */
  function displayLetters(lettersMatched, color) {
    color = color || 'black';
    var $letters = $('.letters');
    $letters.empty();

    _.each(lettersMatched, function(letter) {
      var span = $('<span></span>');
      span.text(letter);
      span.css('color', color);
      $letters.append(span);
    });
  }

  /**
   * Displays the complete game word to the user. This method assumes that the game
   * is a loss, as all letters will be colored red.
   *
   * @param word (string) the word to display
   * @see displayLetters(array, string)
   */
  function displayGameWord(word) {
    displayLetters(word.split(''), 'red');
  }

  /**
   * Increments the winning score value by one.
   */
  function increaseWinningScore() {
    increaseScore($('#wins'));
  }

  /**
   * Increments the losing score value by one.
   */
  function increaseLosingScore() {
    increaseScore($('#losses'));
  }

  /**
   * "Internal" method to increment either the wins or losses score by one.
   */
  function increaseScore($el) {
    var score = +$el.text();
    $el.text(++score);
  }

  $('#reset-score').click(resetScore);

  /**
   * Resets both wins and losses to 0.
   */
  function resetScore() {
    $('#wins').text(0);
    $('#losses').text(0);
  }

  /**
   * Logs any errors received from the server to both the developer console and
   * any .debug elements in the DOM.
   */
  function debug(data) {
    console.log(data);
    $('.debug').text(data);
  }
});