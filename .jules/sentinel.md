
## 2024-05-18 - Refined XSS and Open Redirect Fixes
**Vulnerability:** Initial fix to SVG rendering components incorrectly assumed hardcoded SVGs were vulnerable, which introduced styling bugs (SVG styling not inherited via img tags) and infinite loop risks in onError.
**Learning:** For XSS fixes, verify if the innerHTML content is actually user-controlled. Hardcoded static strings (like inline SVGs) are not XSS vectors. Open Redirect URL validation must account for relative URLs without crashing using `new URL(url, window.location.origin)`. Don't leave shell scripts in the working directory.
**Prevention:** Thoroughly consider React idiomatic patterns and the constraints of `new URL()` before implementing security patches. Always run `git clean` or remove temporary scripts before submission.
