## Initial Exploratory Test Charter for Insitu Hangman Game UI

### Charter
Interact with the UI for 30 minutes, noting any irregularities or possible defects to follow up on

Name: Christian Danielsen
Date: April 6, 2018
Time: 930 PM PST
Env: Localhost
Browser: Chrome

### Investigation heuristics
 - Capability: Does the game perform according to the traditional rules of hangman?
 - Reliability: Is the game resilient to a variety of user interactions? (Mouse vs. keyboard etc.)
 - Validation: Does the UI respond gracefully to actions that should not be permitted? Does the API validation match the UI validation?
 - Layers: UI, API

### Needed configuration/setup notes
 - Clone the repository
 - Run `npm i && node .`
 - Open a browser window to the provided address

### Questions/Observations/Potential Bugs

 UX: no warning for resetting score at any time
 UX: not entirely clear which score belongs to which player
 UX: Player is not penalized for starting a new game in the middle of another one
 UX: No way navigate to docs and back without losing score

 UI Validation:
  Q: Player cannot repeat a letter guess (how does the API handle this?)
  A: Used postman to send various data the UI would not allow (non alpha, lowercase, multiple letters, null...) API responded with helpful error response for all but null

Could the same game be open in multiple tabs or browsers?

Grey bottom bar appears to serve no purpose? (Inspector shows it's classed with "debug")