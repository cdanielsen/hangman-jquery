const test = require('ava')
const rp = require('request-promise').defaults({
  resolveWithFullResponse: true,
  json: true,
  simple: false
})

const { API_HOST } = require('./config')

test('A GET to the /hangman/:id endpoint with a MISSING game id should fail', async t => {
  t.plan(1)
  const res = await rp({
    method: 'GET',
    uri: `${API_HOST}/hangman`
  })

  t.is(res.statusCode, 405)
})

test('A GET to the /hangman/:id endpoint with a NON-EXISTANT game id should fail', async t => {
  t.plan(1)
  const res = await rp({
    method: 'GET',
    uri: `${API_HOST}/hangman/idontexist`
  })

  t.is(res.statusCode, 404)
})

test('A GET to the /hangman:id endpoint with a valid id for a NEWLY CREATED game should succeed', async t => {
  t.plan(3)
  // Arrange
  const postResponse = await rp({
    method: 'POST',
    uri: `${API_HOST}/hangman`
  })
  t.is(postResponse.statusCode, 201)
  const newlyCreatedGame = postResponse.body

  // Act
  const getResponse = await rp({
    method: 'GET',
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`
  })

  // Assert
  t.is(getResponse.statusCode, 200)
  t.deepEqual(newlyCreatedGame, getResponse.body)
})

test('A GET to the /hangman:id endpoint with a valid id for an UPDATED GAME game should succeed', async t => {
  t.plan(8)
  // Arrange
  const postResponse = await rp({
    method: 'POST',
    uri: `${API_HOST}/hangman`
  })
  t.is(postResponse.statusCode, 201)
  const newlyCreatedGame = postResponse.body

  const putResponse = await rp({
    method: 'PUT',
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`,
    body: {
      guess: 'A'
    }
  })
  t.is(putResponse.statusCode, 200)
  const updatedGame = putResponse.body

  // Act
  const getResponse = await rp({
    method: 'GET',
    uri: `${API_HOST}/hangman/${updatedGame.game_id}`
  })

  const {
    game_id,
    word_length,
    letters_guessed,
    is_game_over,
    is_winner
  } = getResponse.body

  // Assert on fields that will be updated or should remain the same in a non-conditional way for this test
  t.is(getResponse.statusCode, 200)
  t.is(game_id, newlyCreatedGame.game_id)
  t.is(word_length, newlyCreatedGame.word_length)
  t.is(letters_guessed.length, 1)
  t.is(is_game_over, false)
  t.is(is_winner, false)
})
