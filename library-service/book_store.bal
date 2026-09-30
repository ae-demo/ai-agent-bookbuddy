// The team's in-memory book catalogue: seeded once at startup, read-only for
// the life of the deployment. No endpoint anywhere adds, edits or removes a row.

const int DEFAULT_LIMIT = 20;
const int MAX_LIMIT = 100;

final Book[] & readonly seedBooks = [
    {id: "b1", title: "The Silent Patient", author: "Alex Michaelides", genre: "mystery", year: 2019, available: true},
    {id: "b2", title: "In the Woods", author: "Tana French", genre: "mystery", year: 2007, available: false},
    {id: "b3", title: "The Likeness", author: "Tana French", genre: "mystery", year: 2008, available: true},
    {id: "b4", title: "Gone Girl", author: "Gillian Flynn", genre: "thriller", year: 2012, available: true},
    {id: "b5", title: "Sharp Objects", author: "Gillian Flynn", genre: "thriller", year: 2006, available: false},
    {id: "b6", title: "The Hobbit", author: "J.R.R. Tolkien", genre: "fantasy", year: 1937, available: true},
    {id: "b7", title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", genre: "fantasy", year: 1954, available: true},
    {id: "b8", title: "Mistborn", author: "Brandon Sanderson", genre: "fantasy", year: 2006, available: true},
    {id: "b9", title: "The Way of Kings", author: "Brandon Sanderson", genre: "fantasy", year: 2010, available: false},
    {id: "b10", title: "Dune", author: "Frank Herbert", genre: "sci-fi", year: 1965, available: true},
    {id: "b11", title: "Foundation", author: "Isaac Asimov", genre: "sci-fi", year: 1951, available: true},
    {id: "b12", title: "I, Robot", author: "Isaac Asimov", genre: "sci-fi", year: 1950, available: true},
    {id: "b13", title: "Sapiens", author: "Yuval Noah Harari", genre: "non-fiction", year: 2011, available: true},
    {id: "b14", title: "Educated", author: "Tara Westover", genre: "biography", year: 2018, available: true},
    {id: "b15", title: "Pride and Prejudice", author: "Jane Austen", genre: "romance", year: 1813, available: true}
];

// Builds the relative URI for a page of `/books` results, preserving whichever
// filters the caller supplied.
function buildPageUri(string? genre, string? author, int 'limit, int offset) returns string {
    string query = "limit=" + 'limit.toString() + "&offset=" + offset.toString();
    if genre is string {
        query = query + "&genre=" + genre;
    }
    if author is string {
        query = query + "&author=" + author;
    }
    return "/books?" + query;
}
