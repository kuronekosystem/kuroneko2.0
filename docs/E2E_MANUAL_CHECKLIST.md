# E2E Manual Checklist

Manual stability checklist for クロネコエンジン 2.0.

## Tooling Status

- Unit tests: Karma/Jasmine.
- Real E2E framework: not configured.
- Playwright/Cypress/Protractor: not installed.

## Checks

| Area | Steps | Expected result | Current result | Notes |
| --- | --- | --- | --- | --- |
| LinkTree `/` | Open `/`. | LinkTree loads, social/VIP buttons are visible, visit counter appears if API is reachable. | Smoke path OK. Counter UI present. | In local headless run, counter request showed `Failed to fetch`; page did not break. |
| Access Center `/access` | Open `/access`. | Three options visible: login, request, status. Back button returns to LinkTree. | Smoke path OK. Text rendered correctly in persisted language. | Language was persisted as `es` during smoke test. |
| Login `/access/login` | Open page and try invalid credentials. | Access fields visible; invalid credentials do not enter gallery and show friendly error. | Route guard target OK. | Full API negative test should be run manually from browser if needed. |
| Request `/access/request` | Fill display name, source, proof text/contact and submit. | Loading appears; success response shows requestCode clearly. | Not fully executed in automated smoke. | Requires live Apps Script call. |
| Status `/access/status` | Query invalid and valid requestCode. | Invalid code shows friendly error; valid code shows status, and approved code shows userCode/accessKey. | Not fully executed in automated smoke. | Requires live Apps Script data. |
| Gallery `/gallery` without session | Clear `sessionStorage.kuronekoVipSession` and open `/gallery`. | Redirects to `/access/login`. | Passed in smoke test. | No legacy sheet calls detected. |
| Gallery with session | Log in with valid userCode/accessKey and open `/gallery`. | Calls `get_exclusive_gallery`; empty items show empty state. | Not executed in smoke. | Needs valid VIP credentials. |
| VIP Board without session | Clear `sessionStorage.kuronekoVipSession` and open `/vip-board`. | Redirects to `/access/login`. | Passed in smoke test. |  |
| VIP Board with session | Log in with valid VIP session and submit suggestion. | Loading/success/error states are visible. | Not executed in smoke. | Needs valid VIP credentials. |
| Admin `/admin` | Open `/admin`. | Admin login form is visible; no credentials hardcoded. | Smoke path OK. | Source scan found no hardcoded admin secrets. |
| Admin invalid login | Enter invalid admin credentials. | Friendly invalid credentials message. | Not fully executed in smoke. | Requires live Apps Script call. |
| Admin valid login | Enter valid admin credentials. | Requests and keys load; loading releases; counts are visible. | Not executed in smoke. | Needs admin credentials. |
| 404 `/ruta-inexistente` | Open unknown route. | 404 page appears. LinkTree button goes to `/`; VIP button goes to `/access`. | Passed in smoke test. | Buttons use fixed router navigation. |
| Translation persistence | Set language, navigate, reload. | `localStorage.kuronekoLanguage` persists and text remains in selected language. | Passed in smoke test for `es`. |  |
| Legacy sheets | Search for `Hoja 1`, `Hoja%201`, `hoja=`, `?hoja=`. | No active references. | Passed. |  |
| Slideshow download | Search gallery source for download/canvas helpers. | No download button/logic remains. | Passed. |  |

## Recommended Future E2E

Add Playwright or Cypress later to automate route smoke tests, guards, i18n persistence, 404 navigation, and mocked API flows. Do not install until approved.
