
const {
  ResetScoreButton,
  WinsScore,
  LossScore,
  NewGameButton,
  WordRevealDisplay,
  GuessButtons,
  HangmanCanvas
} = require('../page_objects/game.po.js')

describe('The initial state of the game', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('The hangman canvas', () => {
    it('Should not have any body parts', () => {
      cy.get(HangmanCanvas).children().should('have.length', 4)
    })
  })

  describe('The letter buttons', () => {
    it('They should all be disabled', () => {
      cy.get(GuessButtons).each(button => cy.wrap(button).should('have.class', 'disabled'))
    })
  })

  describe('The Reset Score button', () => {
    it('Should be clickable on initial page load and not effect the initial 0-0 score', () => {
      cy.get(ResetScoreButton).should('be.visible')
      cy.get(WinsScore).should('contain', '0')
      cy.get(LossScore).should('contain', '0')
      cy.get(ResetScoreButton).click()
      cy.get(WinsScore).should('contain', '0')
      cy.get(LossScore).should('contain', '0')
    })
  })

  describe('The New Game button', () => {
    it('Should be clickable on initial page load and make the game playable when clicked', () => {
      cy.get(NewGameButton).should('be.visible').click()
      cy.get(WordRevealDisplay).should('not.be.empty')
      cy.get(GuessButtons).each(button => cy.wrap(button).should('not.have.class', 'disabled'))
    })
  })
})
