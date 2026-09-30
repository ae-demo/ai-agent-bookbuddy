Feature: Book discovery through book-buddy

  @story-1
  Rule: A Team Member can search the catalogue by genre

    Scenario: Asking for a genre with matches
      Given the catalogue holds mystery novels including "The Silent Patient"
      When Priya asks book-buddy for a mystery novel to read
      Then book-buddy names a mystery book that is in the catalogue

    @negative
    Scenario: Asking for a genre with no matches
      Given the catalogue holds no "romance" books
      When Priya asks book-buddy for a romance novel
      Then book-buddy tells her no matching book is in the catalogue

  @story-2
  Rule: A Team Member can search the catalogue by author

    Scenario: Asking for more books by a known author
      Given the catalogue holds books by "Tana French"
      When Dev asks book-buddy for more books by "Tana French"
      Then book-buddy names a book by "Tana French" that is in the catalogue

  @story-3
  Rule: A Team Member can ask about a specific book

    Scenario: Asking about a title in the catalogue
      Given "In the Woods" is in the catalogue
      When Priya asks book-buddy about "In the Woods"
      Then book-buddy describes "In the Woods" with its author and genre

  @story-4
  Rule: book-buddy always states a book's current availability

    Scenario: The book is available
      Given "The Silent Patient" is in the catalogue and marked available
      When Dev asks book-buddy whether "The Silent Patient" is available
      Then book-buddy tells him it is currently available

    Scenario: The book is not available
      Given "In the Woods" is in the catalogue and marked unavailable
      When Priya asks book-buddy whether "In the Woods" is available
      Then book-buddy tells her it is not currently available

  @story-5
  Rule: book-buddy suggests related catalogue titles alongside its answer

    Scenario: A genre answer comes with related titles
      Given the catalogue holds more than one mystery novel
      When Dev asks book-buddy for a mystery novel to read
      Then book-buddy also names at least one other mystery novel from the catalogue

  @story-6
  Rule: book-buddy never mentions a title that is not in the catalogue

    @negative
    Scenario: A request for a genre the catalogue does not have
      Given the catalogue holds no "poetry" books
      When Priya asks book-buddy for a poetry book
      Then every title book-buddy names is a book actually in the catalogue
