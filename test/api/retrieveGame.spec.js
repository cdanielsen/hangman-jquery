const test = require("ava");
const rp = require("request-promise").defaults({
  resolveWithFullResponse: true,
  json: true,
  simple: false
});

const { API_HOST } = require('./config')

test("A GET to the /hangman/:id endpoint with a MISSING game id should fail", async t => {
  t.plan(1);
  const res = await rp({
    method: "GET",
    uri: `${API_HOST}/hangman`,
  });

  t.is(res.statusCode, 405)
});

test("A GET to the /hangman/:id endpoint with a NON-EXISTANT game id should fail", async t => {
  t.plan(1);
  const res = await rp({
    method: "GET",
    uri: `${API_HOST}/hangman/idontexist`,
  });

  t.is(res.statusCode, 404)
});

test("A GET to the /hangman:id endpoint with a valid id for a newly created game should succeed", async t => {
  t.plan(3)
  // Arrange
  const postResponse = await rp({
    method: "POST",
    uri: `${API_HOST}/hangman`
  });
  t.is(postResponse.statusCode, 201)
  const newlyCreatedGame = postResponse.body
 
  // Act
  const getResponse = await rp({
    method: "GET",
    uri: `${API_HOST}/hangman/${newlyCreatedGame.game_id}`,
  });

  // Assert
  t.is(getResponse.statusCode, 200)
  t.deepEqual(newlyCreatedGame, getResponse.body)
})
