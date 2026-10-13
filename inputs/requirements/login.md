# Login Feature

## Requirement

A registered user must be able to authenticate against Demoblaze by
submitting valid username and password credentials through the Log in
modal. The system must validate the credentials against the backend
and, on success, transition the user into an authenticated session.
On failure, the system must surface a clear, user-visible error.

## Acceptance Criteria

- User can open the login form from the navbar.
- User can enter a username and a password.
- User can log in with valid credentials and be transitioned into an
  authenticated session.
- Invalid credentials must display an appropriate error and must NOT
  transition the user into an authenticated session.
- Empty username or empty password must be rejected client-side or
  with a clear error and must NOT make a backend request.

## Notes

- The login modal is a Bootstrap modal with the `id="logInModal"`
  attribute. See `.claude/agents/qa-agent/selector-cheatsheet.md` for
  verified selectors.
- Logout must return the user to the unauthenticated state.
- The "Welcome <username>" indicator in the navbar is the source of
  truth for authenticated state in the UI.
