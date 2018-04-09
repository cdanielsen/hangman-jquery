const HangManPageObject = () => ({
  ResetScoreButton: 'button#reset-score',
  NewGameButton: 'button#new-game-button',
  WinsScore: 'span#wins',
  LossScore: 'span#losses',
  WordRevealDisplay: 'div.letters',
  WordRevealDisplayLetterHolders: 'div.letters span',
  GuessButtons: 'button.guess-btn',
  HangmanCanvas: 'div#hangman svg'
})

export default HangManPageObject()
