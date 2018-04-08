
const { ResetScoreButton, WinsScore, LossScore, NewGameButton } = require('../page_objects/game.po.js')

const UI_HOST = 'http://localhost:8124'

describe('The initial state of the game', () => {
  beforeEach(() => {
    cy.visit(UI_HOST)
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
})