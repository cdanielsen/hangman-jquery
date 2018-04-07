## Initial Exploratory Test Charter for Insitu Hangman Game API

### Charter
Explore the Swagger documentation for the Hangman API. Use the "Try it out!" buttons to use the API as well as POSTMAN. Note observations / inconsistencies / potential bugs

Name: Christian Danielsen
Date: April 6, 2018
Time: 1030 PM PST
Env: Localhost
Browser: Chrome

### Investigation heuristics
 - Capability: Do the endpoints respond as expected with valid data?
 - Validation: Do the endpoints respond with informative error messages when the user passes a bad request? 

### Needed configuration/setup notes
 - Start the server with `node .`
 - Swagger docs page; Postman

### Questions/Observations/Potential Bugs

**ENDPOINT EXPLORATION NOTES**

**POST /hangman** endpoint

Valid request responds as expected (returns a created game response with all fields containing default values)

**GET /hangman/:id** endpoint

Valid request responds as expected (returns a created game response with correct field values)

Bad Request Case (no id in url)
 - Results in a 405 (Method not allowed) with a reasonable error message: `Error: Route defined in Swagger specification (/hangman) but there is no defined get operation.`
 - **NOTE:** Returns a less graceful HTML response with a stack trace

Bad Request Case (junk id "hello")
 - Results in a 404 (Not Found) with a reasonable error message: `{ "error": "No game with ID \"8a6f0850-3a2a-11e8-8bac-9db84ea5c\" was found." }`

**PUT /hangman/:id** endpoint

Valid request cases:
- Sending a correct letter but not completing word:
  - Responds with a 200 (OK) and correct field adjustments ('letters_guessed' and 'letters_matched' arrays)
- Sending an incorrect letter with > 1 guesses remaining:
  - Responds with a 200 (OK) and correct field adjustments ('letters_guessed' array and 'remanining_incorrect_guesses' integer is decremented)
- Sending an incorrect letter with exactly 1 guess remaining:
  - Responds with a 200 (OK) and correct field adjustments ('letters_guessed' array, 'remaining_incorrect_guesses and 'is_game_over' is set to true while 'is_winner' remains false. Additional "word" property with answer is sent.)
- Sending the final correct letter with at >= 1 guess remaining:
  - Responds with a 200 (OK) and correct field adjustments ('letters_guessed' array, 'is_game_over' AND 'is_winner' set to true. Additional "word" property with answer is sent.)

Bad Request Case (junk id "insitu"):
  - Results in a 404 (Not Found) with a reasonable error message: `{ "error": "No game with ID \"8a6f0850-3a2a-11e8-8bac-9db84ea5c\" was found." }`

Bad Request Case (junk id AND missing request body object with valid 'guess' property):
  - **NOTE:** Missing content body validation is hit first (seems backward?)

Bad Request Case (missing request body object with valid 'guess' property):
  - Results in a 400 (Bad Request) with a low level error message: `Error: Parameter (content) failed schema validation`
  - **NOTE:** Returns a less graceful HTML response with a stack trace

Bad Request Cases (invalid supplied 'guess' property):
- Non-alpha single character ('!', '1' ' ' )
  - All result in a 400 (Bad Request) with a reasonable error message: `{ "error": "Guess must be an English letter between A and Z." }`
- Multiple characters ('ab', ' C', 'D ' 'SFADAFDSA')
  - All result in a 400 (Bad Request) with a reasonable error message: `{ "error": "Must provide single character guess." }`
- Lower-cased alpha character ('a')
  - Succeeds / is idempotent

**DELETE /hangman/:id** endpoint

Valid request responds as expected (empty response body)

Bad request case (junk id 'lebowski')
 - Results in a 404 (Not Found) with a reasonable error message: `"error": "No game with ID \"0d5af9a0-3a2f-11e8-8bac-9db84ea5c992\" was found."`

Bad Request case (previously deleted id "0d5af9a0-3a2f-11e8-8bac-9db84ea5c992")
 - Results in a 404 (Not Found) with a reasonable error message: `"error": "No game with ID \"0d5af9a0-3a2f-11e8-8bac-9db84ea5c992\" was found."`

### Potential Bugs ###
**Swagger docs, ALL endpoints**
All the "Try it out" buttons fail with a 405 response (Method Not Allowed). Network tab/console inspection shows button click is sending a request to `hangman.localhost:8124` instead of just `localhost:8124`, triggering an OPTIONS request for CORS purposes. The request fails with the following message in the console:
```
Failed to load http://hangman.localhost:8124/hangman: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://localhost:8124' is therefore not allowed access. The response had HTTP status code 405.
```

**Note:** Putting http://localhost:8124/api-docs into the browser returns Swagger meta-data indicating a "host" value of `hangman.localhost:8124`

**Note:** Requests made via Postman to described endpoints return the response as expected
