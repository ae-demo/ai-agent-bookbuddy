# ai-agent-bookbuddy — PRD

## Problem Statement

A small team keeps a shared library of books, but there is no quick way for someone to find out what is on the shelf, what genres or authors are represented, or whether a specific book is free to borrow right now. Today that means physically checking the shelf or asking around, which wastes time and often turns up nothing.

## Solution

book-buddy is a conversational AI agent, reached through the standard chat interface, that helps team members discover and check on books in the shared library. It answers questions about genre, author, and availability, and proactively points out related books the catalogue actually holds — never a title that doesn't exist in it. It is backed by library-service, a small backend holding an in-memory catalogue of about 15 books.

## Actors

- **Team Member** — any team member who chats with book-buddy to find a book to read, ask about a genre or author, or check whether a specific book is currently available. This is the only actor; the catalogue is static and nobody manages it through the product.

## User Stories

1. As a Team Member, I want to search for books by genre, so that I can find something to read in a genre I like.
2. As a Team Member, I want to search for books by author, so that I can find more books by an author I enjoy.
3. As a Team Member, I want to ask book-buddy about a specific book, so that I can see its details.
4. As a Team Member, I want book-buddy to tell me whether a book is currently available, so that I know if I can borrow it now.
5. As a Team Member, when book-buddy answers my question, I want it to also suggest a few related books (same genre or author) from the catalogue, so that I discover more options without asking again.
6. As a Team Member, I want book-buddy to only ever mention books that are actually in the library catalogue, so that I'm never sent looking for a title that doesn't exist.

## Product Decisions

- Catalogue scope: library-service holds an in-memory catalogue of about 15 books (title, author, genre, year, available true/false), seeded once and static for this build — no actor adds, edits, or removes books through the product.
- Availability is read-only: book-buddy reports whether a book is available but never changes that status; checking a book in or out is not part of this product.
- Recommendations: beyond directly answering a genre/author/title/availability question, book-buddy proactively surfaces a few related books (matching genre or author) drawn only from the catalogue it can see through its allowed lookups.
- Interaction channel: Team Members talk to book-buddy through the standard `/chat` interface via the Try it test app — no dedicated web app.
- Backend surface: library-service exposes exactly two read endpoints — `GET /books` (`searchBooks`, with optional `genre` and `author` filters) and `GET /books/{id}` (`getBook`). book-buddy's tool allow-list is restricted to these two operations; it has no path to modify data.
- No sign-in flow: with no web app and no user-specific data, book-buddy is not gated behind SSO for this build.

## Out of Scope

- Catalogue management (adding, editing, or removing books or authors) — the catalogue is a static seed.
- Checking books in or out, holds, reservations, or any action that changes a book's availability.
- Any interface beyond the standard `/chat` interface via the Try it test app (no dedicated web or mobile UI).
- Authentication, authorization, or per-user permissions.

## Open Questions

*(none — the interview converged; all decisions above are settled.)*