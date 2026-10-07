# Demoblaze — Selector Cheatsheet (verified)

This is the **single source of truth** for stable selectors in the
Demoblaze application. The agent MUST consult this file before writing or
reviewing any Playwright code.

Selectors here were verified against the live HTML on 2026-10-08 by reading
the served markup and JavaScript directly.

## Priority order for locators

1. `getByRole` (link / button / heading) when the visible text is stable
2. Stable IDs documented below
3. Modal-scoped locators
4. **Avoid** `nth()`, deep CSS chains, `:has-text` cross-document, brittle
   class chains

## Bootstrap modals (always Bootstrap — wait for `.show` class)

| Modal       | Container ID    | Verify with                                           |
| ----------- | --------------- | ----------------------------------------------------- |
| Login       | `#logInModal`   | `expect(page.locator('#logInModal')).toBeVisible()`   |
| Signup      | `#signInModal`  | `expect(page.locator('#signInModal')).toBeVisible()`  |
| Contact     | `#exampleModal` | `expect(page.locator('#exampleModal')).toBeVisible()` |
| About us    | `#videoModal`   | rarely tested                                         |
| Place Order | `#orderModal`   | only on `cart.html`; `expect(...).toBeVisible()`      |

## Login modal

| Element        | Stable selector                                |
| -------------- | ---------------------------------------------- |
| Username input | `page.locator('#loginusername')`               |
| Password input | `page.locator('#loginpassword')`               |
| Submit button  | `page.getByRole('button', { name: 'Log in' })` |
| Close button   | `page.getByRole('button', { name: 'Close' })`  |

## Signup modal

| Element        | Stable selector                                 |
| -------------- | ----------------------------------------------- |
| Username input | `page.locator('#sign-username')`                |
| Password input | `page.locator('#sign-password')`                |
| Submit button  | `page.getByRole('button', { name: 'Sign up' })` |

## Contact modal

| Element       | Stable selector                                      |
| ------------- | ---------------------------------------------------- |
| Email input   | `page.locator('#recipient-email')`                   |
| Name input    | `page.locator('#recipient-name')`                    |
| Message input | `page.locator('#message-text')`                      |
| Submit button | `page.getByRole('button', { name: 'Send message' })` |

## Navbar

| Element      | Stable selector                                                         |
| ------------ | ----------------------------------------------------------------------- |
| Home         | `page.getByRole('link', { name: 'Home' })`                              |
| Contact      | `page.getByRole('link', { name: 'Contact' })`                           |
| About us     | `page.getByRole('link', { name: 'About us' })`                          |
| Cart         | `page.locator('#cartur')` or `page.getByRole('link', { name: 'Cart' })` |
| Log in       | `page.locator('#login2')`                                               |
| Log out      | `page.locator('#logout2')`                                              |
| Welcome text | `page.locator('#nameofuser')`                                           |
| Sign up      | `page.locator('#signin2')`                                              |

> Note: there are **duplicate `id="itemc"` values** in the home page DOM
> (Phones / Laptops / Monitors all share `#itemc`). Do NOT use `#itemc` as
> a unique locator. Use `page.getByRole('link', { name: 'Phones' })` etc.

## Home page — product grid

| Element            | Stable selector                                                            |
| ------------------ | -------------------------------------------------------------------------- |
| Product grid       | `page.locator('#tbodyid')`                                                 |
| Product card link  | `page.locator('#tbodyid .card-title a')`                                   |
| A specific product | `page.locator('#tbodyid .card-title a', { hasText: 'Samsung galaxy s6' })` |
| Pagination Next    | `page.locator('#next2')`                                                   |
| Pagination Prev    | `page.locator('#prev2')`                                                   |

## Product detail page (`prod.html?idp_=...`)

| Element       | Notes                                                         |
| ------------- | ------------------------------------------------------------- |
| Title heading | injected into `#tbodyid` as `<h2 class="name">`               |
| Price         | injected as `<h3 class="price-container">`                    |
| Description   | `<div id="more-information">`                                 |
| Add to cart   | `page.getByRole('link', { name: 'Add to cart' })` — `<a>` tag |

## Cart page (`cart.html`)

| Element         | Stable selector                                     |
| --------------- | --------------------------------------------------- |
| Table body      | `page.locator('table tbody#tbodyid')`               |
| Cart row        | `page.locator('#tbodyid tr')`                       |
| Delete link     | `page.locator('#tbodyid a', { hasText: 'Delete' })` |
| Total (small)   | `page.locator('#totalp')`                           |
| Place Order btn | `page.getByRole('button', { name: 'Place Order' })` |

## Place Order modal (`cart.html` only)

| Element         | Stable selector                                  |
| --------------- | ------------------------------------------------ |
| Total label     | `page.locator('#totalm')`                        |
| Name input      | `page.locator('#name')`                          |
| Country input   | `page.locator('#country')`                       |
| City input      | `page.locator('#city')`                          |
| Credit card     | `page.locator('#card')`                          |
| Month           | `page.locator('#month')`                         |
| Year            | `page.locator('#year')`                          |
| Purchase button | `page.getByRole('button', { name: 'Purchase' })` |

## Dialogs (native `alert()`)

Demoblaze uses `window.alert()` for many actions. **A Playwright session
without a dialog handler will hang.**

Verified messages (exact strings):

| Trigger                     | Message                                       |
| --------------------------- | --------------------------------------------- |
| Login empty fields          | `Please fill out Username and Password.`      |
| Login wrong password        | `Wrong password.`                             |
| Login user not found        | `User does not exist.`                        |
| Signup empty fields         | `Please fill out Username and Password.`      |
| Signup user exists          | `This user already exist.`                    |
| Signup success              | `Sign up successful.`                         |
| Contact send                | `Thanks for the message!!`                    |
| Add to cart (anonymous)     | `Product added` (no trailing period)          |
| Add to cart (authenticated) | `Product added.` (with trailing period)       |
| Place Order empty Name/Card | `Please fill out Name and Creditcard.`        |
| Token expired               | `Your token has expired, please login again.` |

**A test must register a `page.on('dialog', d => d.accept())` handler
BEFORE** any action that may trigger an alert. Capture the message via
`automation/utils/dialogHandler.ts`.

## SweetAlert (non-native modal)

The Place Order purchase confirmation uses **SweetAlert**, NOT a native
dialog. After clicking Purchase:

- The success modal renders `.swal-modal` with `.swal-title`
  ("Thank you for your purchase!") and a `.swal-button` ("OK").
- Playwright's `page.on('dialog')` will NOT catch this.
- Use `automation/utils/dialogHandler.ts#waitForSweetAlertAndAccept`.
- After the OK click, the page navigates to `index.html`.

## Cookies and session

- Login sets cookie `tokenp_` (Auth token). Cleared on logout.
- Anonymous cart uses cookie `user=<guid>`. Cleared when cart is emptied.
- Tests must clear cookies between cases if running in shared context.

## Known flaky areas

- `location.reload()` after login/signup/contact — assert on the navbar's
  new state, not on the alert.
- SweetAlert on purchase: the modal is in the DOM but the page may also
  reload — wait for either the modal OR the `index.html` URL.
- Duplicate `#itemc` IDs in the home page — do not use as a unique locator.
- Product list is paginated (9 per page). Tests that need a specific
  product must iterate pages or locate by title text.
