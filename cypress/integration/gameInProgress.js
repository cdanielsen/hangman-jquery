const {
  NewGameButton,
  GuessButtons,
  WordRevealDisplayLetterHolders
} = require('../page_objects/game.po.js')

describe('A game in progress...', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get(NewGameButton).should('be.visible').click()
    // Guess all the vowels to guarantee an in-progress game of some kind
    cy.get(GuessButtons).eq(0).click()
    cy.get(GuessButtons).eq(4).click()
    cy.get(GuessButtons).eq(8).click()
    cy.get(GuessButtons).eq(14).click()
    cy.get(GuessButtons).eq(20).click()
  })

  describe('The New Game Button', () => {
    it('Should be clickable after a game has started, but allow the user to cancel', () => {
      // Cypress accepts confirmation dialog boxes by default. This simulates clicking "cancel"
      const cancelConfirm = confirmationText => false
      cy.on('window:confirm', cancelConfirm)
      cy.get(NewGameButton).should('be.visible').click()

      // Assert that the game state has not been cleared
      cy.get(GuessButtons).eq(0).should('have.attr', 'disabled')
      cy.get(GuessButtons).eq(4).should('have.attr', 'disabled')
      cy.get(GuessButtons).eq(8).should('have.attr', 'disabled')
      cy.get(GuessButtons).eq(14).should('have.attr', 'disabled')
      cy.get(GuessButtons).eq(20).should('have.attr', 'disabled')
        .then(() => {
        // Cleanup: Reset default behavior between tests
          cy.removeListener('window:confirm', cancelConfirm)
        })
    })

    it('Should be clickable after a game has started, and reset the game state if the user confirms', () => {
      cy.get(NewGameButton).click()
      cy.get(GuessButtons).eq(0).should('not.have.attr', 'disabled')
      cy.get(GuessButtons).eq(4).should('not.have.attr', 'disabled')
      cy.get(GuessButtons).eq(8).should('not.have.attr', 'disabled')
      cy.get(GuessButtons).eq(14).should('not.have.attr', 'disabled')
      cy.get(GuessButtons).eq(20).should('not.have.attr', 'disabled')
      cy.get(WordRevealDisplayLetterHolders).each(holder => cy.wrap(holder).should('contain', '_'))
    })
  })
})
