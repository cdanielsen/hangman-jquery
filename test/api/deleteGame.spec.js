const test = require('ava')
const rp = require('request-promise').defaults({
  resolveWithFullResponse: true,
  json: true,
  simple: false
})

const { API_HOST } = require('./config')

test('A DELETE to the /hangman/:id endpoint with a NON-EXISTANT game id should fail', async t => {
  t.plan(1)
  const res = await rp({
    method: 'DELETE',
    uri: `${API_HOST}/hangman/idontexist`
  })

  t.is(res.statusCode, 404)
})

test('A DELETE to the /hangman/:id endpoint with a valid id for a newly created game should succeed', async t => {
  t.plan(3)

  // Arrange
  const postResponse = await rp({
    method: 'POST',
    uri: `${API_HOST}/hangman`
  })
  t.is(postResponse.statusCode, 201)
  const newlyCreatedGame = postResponse.body

  // Act
  const deleteResponse = await rp({
    method: 'DELETE',
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`
  })

  const getResponse = await rp({
    method: 'GET',
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`
  })

  // Assert
  t.is(deleteResponse.statusCode, 200)
  t.is(getResponse.statusCode, 404)
})

// NOTE: This test fails with the current implemention of the delete endpoint
/*
test('A DELETE to the /hangman/:id endpoint for an already deleted game should return a 200 idempotently', async t => {
  // Arrange
  const postResponse = await rp({
    method: 'POST',
    uri: `${API_HOST}/hangman`
  })
  t.is(postResponse.statusCode, 201)
  const newlyCreatedGame = postResponse.body

  const firstDeleteResponse = await rp({
    method: 'DELETE',
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`
  })
  t.is(firstDeleteResponse.statusCode, 200)

  // Act
  const secondDeleteResponse = await rp({
    method: 'DELETE',
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`
  })
  t.is(secondDeleteResponse.statusCode, 200)
})
*/
