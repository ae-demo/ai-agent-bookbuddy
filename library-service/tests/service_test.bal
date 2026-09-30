// Resource tests against the running service — asserts the public contract
// (searchBooks filtering/pagination, getBook lookup) rather than internals.

import ballerina/http;
import ballerina/test;

final http:Client testClient = check new ("http://localhost:9090");

@test:Config {}
function testSearchByGenre() returns error? {
    http:Response resp = check testClient->get("/books?genre=fantasy");
    test:assertEquals(resp.statusCode, 200);
    BooksPage page = check (check resp.getJsonPayload()).cloneWithType(BooksPage);
    test:assertEquals(page.count, 4);
    foreach Book b in page.data {
        test:assertEquals(b.genre, "fantasy");
    }
}

@test:Config {}
function testSearchByAuthor() returns error? {
    http:Response resp = check testClient->get("/books?author=Tana%20French");
    test:assertEquals(resp.statusCode, 200);
    BooksPage page = check (check resp.getJsonPayload()).cloneWithType(BooksPage);
    test:assertEquals(page.count, 2);
    foreach Book b in page.data {
        test:assertEquals(b.author, "Tana French");
    }
}

@test:Config {}
function testSearchByGenreAndAuthor() returns error? {
    http:Response resp = check testClient->get("/books?genre=mystery&author=Alex%20Michaelides");
    test:assertEquals(resp.statusCode, 200);
    BooksPage page = check (check resp.getJsonPayload()).cloneWithType(BooksPage);
    test:assertEquals(page.count, 1);
    test:assertEquals(page.data[0].id, "b1");
}

@test:Config {}
function testSearchNoFilter() returns error? {
    http:Response resp = check testClient->get("/books");
    test:assertEquals(resp.statusCode, 200);
    BooksPage page = check (check resp.getJsonPayload()).cloneWithType(BooksPage);
    test:assertEquals(page.count, 15);
    test:assertEquals(page.data.length(), 15);
    test:assertEquals(page.next, ());
    test:assertEquals(page.previous, ());
}

@test:Config {}
function testSearchInvalidParam() returns error? {
    http:Response resp = check testClient->get("/books?unknown=value");
    test:assertEquals(resp.statusCode, 400);
    Error errorBody = check (check resp.getJsonPayload()).cloneWithType(Error);
    test:assertEquals(errorBody.code, 400);
}

@test:Config {}
function testGetBookFound() returns error? {
    http:Response resp = check testClient->get("/books/b1");
    test:assertEquals(resp.statusCode, 200);
    Book book = check (check resp.getJsonPayload()).cloneWithType(Book);
    test:assertEquals(book.id, "b1");
    test:assertEquals(book.title, "The Silent Patient");
}

@test:Config {}
function testGetBookNotFound() returns error? {
    http:Response resp = check testClient->get("/books/does-not-exist");
    test:assertEquals(resp.statusCode, 404);
    Error errorBody = check (check resp.getJsonPayload()).cloneWithType(Error);
    test:assertEquals(errorBody.code, 404);
}
