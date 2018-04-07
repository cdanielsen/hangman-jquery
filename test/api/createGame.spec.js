const test = require('ava')
const rp = require('request-promise').defaults({
  resolveWithFullResponse: true,
  json: true
})

const { API_HOST } = require('./config')

test('A valid POST request to the /hangman endpoint should return a game instance', async t => {
  t.plan(15)
  const res = await rp({
    method: 'POST',
    uri: `${API_HOST}/hangman`
  })
  const {
    game_id,
    word_length,
    letters_guessed,
    letters_matched,
    remaining_incorrect_guesses,
    is_game_over,
    is_winner
  } = res.body

  // TODO: Refactor the type assertions into a JSON schema validation

  t.is(res.statusCode, 201)

  t.is(typeof game_id, 'string')
  t.true(game_id.length === 36)

  t.is(typeof word_length, 'number')

  t.true(Array.isArray(letters_guessed))
  t.true(letters_guessed.length === 0)

  const expectedStartingArray = new Array(word_length).fill('_')
  t.true(Array.isArray(letters_matched))
  t.true(letters_matched.length === word_length)
  t.deepEqual(expectedStartingArray, letters_matched)

  t.is(typeof remaining_incorrect_guesses, 'number')
  t.is(remaining_incorrect_guesses, 6)

  t.is(typeof is_game_over, 'boolean')
  t.is(is_game_over, false)

  t.is(typeof is_winner, 'boolean')
  t.is(is_winner, false)
})
