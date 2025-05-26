# Integration Test Outlines for Public View System

This document outlines key integration tests for the public view system, including the `PublicHome` page and routing behaviors. These tests would typically be implemented using a framework like Cypress or Playwright, combined with React Testing Library for component interactions where appropriate.

## I. PublicHome Page (`client/src/pages/PublicHome.tsx`)

**Setup:**
*   Ensure the backend server is running and accessible.
*   Mock or seed the database with a known set of public and private snippets. Include snippets with various languages and tags.
*   Use a testing utility or direct API calls to `/api/public/snippets` to verify data setup.

**Test Scenarios:**

1.  **Initial Load and Display:**
    *   **Description:** Verify that `PublicHome` fetches and displays public snippets correctly on initial load.
    *   **Steps:**
        1.  Navigate to the `/` route as an unauthenticated user.
        2.  Observe that the `PublicHome` component renders.
        3.  Check that a list/grid of snippets is displayed.
        4.  Verify that only snippets marked `isPublic: true` in the database are shown.
        5.  Confirm that elements like the header, tagline, and "Sign In" button are present.
        6.  Check for loading states while data is being fetched.
    *   **Assertions:**
        *   Correct number of public snippets displayed.
        *   Snippet cards show appropriate information (title, description snippet, language, "Public" badge).
        *   No private snippets are visible.
        *   Header and sign-in elements are visible.

2.  **Search Functionality:**
    *   **Description:** Test if searching filters the displayed public snippets.
    *   **Steps:**
        1.  On `PublicHome`, type a search term (e.g., a keyword from a known public snippet's title or description) into the search bar.
        2.  Observe the list of snippets updating.
    *   **Assertions:**
        *   Only snippets matching the search term are displayed.
        *   If the search term matches no public snippets, an appropriate "No public snippets found" message is shown.
        *   The filtering should be reasonably fast (client-side or server-side depending on implementation).

3.  **Filter Functionality (Language/Tags):**
    *   **Description:** Test if filtering by language (and tags, if implemented) works correctly.
    *   **Steps:**
        1.  On `PublicHome`, select a language from the language filter dropdown.
        2.  Observe the list of snippets updating.
        3.  (If applicable) Select a tag from a tag filter dropdown and observe further filtering.
    *   **Assertions:**
        *   Only snippets matching the selected language (and/or tag) are displayed.
        *   Combining search and filters works as expected.
        *   If no snippets match the filter criteria, an appropriate message is shown.

4.  **Empty State:**
    *   **Description:** Verify the behavior when no public snippets are available or match filters.
    *   **Steps:**
        1.  Ensure the database has no snippets marked `isPublic: true`.
        2.  Navigate to `PublicHome`.
        3.  OR: Apply filters that result in no matches.
    *   **Assertions:**
        *   The correct "No public snippets found" (or similar) message is displayed.
        *   The layout remains intact.

5.  **Sign-In Button Navigation:**
    *   **Description:** Ensure the "Sign In" button navigates to the login flow.
    *   **Steps:**
        1.  On `PublicHome`, click the "Sign In / Sign Up" button.
    *   **Assertions:**
        *   The user is redirected to the application's login page/mechanism (e.g., `/login` or triggers the Firebase auth flow).

## II. Routing and Authentication State

**Setup:**
*   As above, backend running with mixed public/private data.
*   Ability to simulate user login/logout within the test environment.

**Test Scenarios:**

1.  **Unauthenticated User Access:**
    *   **Description:** Verify routes accessible to unauthenticated users.
    *   **Steps:**
        1.  As an unauthenticated user, navigate to `/`.
        2.  Navigate to `/shared/:shareId` (using a share ID of a public snippet).
        3.  Navigate to `/shared/:shareId` (using a share ID of a private snippet).
        4.  Attempt to navigate to an authenticated route (e.g., `/snippets` or `/settings`).
    *   **Assertions:**
        *   `/` loads `PublicHome`.
        *   `/shared/:shareId` for a public snippet loads the `SharedSnippet` page and displays the snippet.
        *   `/shared/:shareId` for a private snippet either shows a "not found/access denied" message within `SharedSnippet` or redirects (behavior depends on `SharedSnippet` implementation).
        *   Access to `/snippets` or `/settings` redirects to `PublicHome` (or the login page).

2.  **Authenticated User Access:**
    *   **Description:** Verify routes and UI changes for authenticated users.
    *   **Steps:**
        1.  Log in as a user.
        2.  Navigate to `/`.
        3.  Navigate to other authenticated routes like `/snippets`, `/collections`.
        4.  Navigate to `/shared/:shareId` (using a share ID of a snippet they own, and one they don't but is public).
    *   **Assertions:**
        *   `/` loads the authenticated dashboard (e.g., `Home.tsx` for authenticated users, not `PublicHome`).
        *   Authenticated routes are accessible and render correctly.
        *   Layout for authenticated users includes the sidebar and full header.
        *   Snippet cards on authenticated pages show owner controls for owned snippets.
        *   `SharedSnippet` page works correctly for owned and public shared snippets.

3.  **Navigation from Public to Authenticated:**
    *   **Description:** Test the transition when a user signs in from `PublicHome`.
    *   **Steps:**
        1.  Start on `PublicHome` as an unauthenticated user.
        2.  Click "Sign In" and complete the login process.
    *   **Assertions:**
        *   After successful login, the user is redirected to the authenticated dashboard (e.g., `/`).
        *   The UI updates to the authenticated layout (sidebar appears, etc.).

## III. Shared Snippet Page (`client/src/pages/SharedSnippet.tsx`)

**Note:** These depend heavily on `SharedSnippet.tsx`'s internal logic, which also needs to be context-aware.

1.  **Public Shared Snippet (Unauthenticated User):**
    *   **Description:** An unauthenticated user views a publicly shared snippet.
    *   **Assertions:** Snippet content is visible. No owner controls.
2.  **Private Shared Snippet (Unauthenticated User):**
    *   **Description:** An unauthenticated user attempts to view a private shared snippet.
    *   **Assertions:** Snippet content is NOT visible. A "not found" or "access denied" message is shown.
3.  **Private Shared Snippet (Authenticated Owner):**
    *   **Description:** The owner views their own private shared snippet.
    *   **Assertions:** Snippet content is visible. Owner controls might be visible (depends on design).
4.  **Private Shared Snippet (Authenticated Non-Owner):**
    *   **Description:** An authenticated user (not the owner) attempts to view a private shared snippet.
    *   **Assertions:** Snippet content is NOT visible. A "not found" or "access denied" message.
5.  **Public Shared Snippet (Authenticated User):**
    *   **Description:** An authenticated user views a public snippet (owned by someone else).
    *   **Assertions:** Snippet content is visible. No owner controls.
```
