from typing import List, Optional
from uuid import UUID

from ..Brokers.bookBroker import BookBroker
from ..Models.Books import (BookCopyStats, BookCreate, BookResponse,
                            BookWithStatsAndCoursesResponse,
                            BookWithStatsResponse, CourseInfo)
from .IService import IBookService


class BookService(IBookService):
    def __init__(self, broker: BookBroker):
        self.broker = broker

    async def RetrieveAllBooks(
        self, skip: int = 0, limit: int = 10
    ) -> List[BookResponse]:
        return [
            BookResponse(**book)
            for book in await self.broker.SelectAllBooks(skip=skip, limit=limit)
        ]

    async def RetrieveBookById(self, book_id: UUID) -> Optional[BookResponse]:
        book_data = await self.broker.SelectBookById(book_id)
        return BookResponse(**book_data) if book_data is not None else None

    async def AddBook(self, book: BookCreate) -> BookResponse:
        existing_book = await self.broker.SelectBookByIsbn(book.isbn)
        if existing_book:
            raise ValueError(f"ISBN {book.isbn} already exists")
        book_data = book.model_dump()
        return BookResponse(**await self.broker.InsertBook(book_data))

    async def ModifyBook(
        self, book_id: UUID, book: BookCreate
    ) -> Optional[BookResponse]:
        if not await self.broker.SelectBookById(book_id):
            return None
        update_data = book.model_dump(exclude_unset=True)
        updated_book = await self.broker.UpdateBook(book_id, update_data)
        return BookResponse(**updated_book) if updated_book is not None else None

    async def RemoveBook(self, book_id: UUID) -> bool:
        return await self.broker.DeleteBook(book_id)

    async def SearchBooks(self, query: str) -> List[BookResponse]:
        """Search books by title, author, or ISBN"""
        books = await self.broker.SearchBooks(query)
        return [BookResponse(**book) for book in books]

    async def RetrieveBooksWithStats(
        self, skip: int = 0, limit: int = 50
    ) -> List[BookWithStatsResponse]:
        """Get books with copy statistics"""
        books_with_stats = await self.broker.SelectAllBooksWithStats(
            skip=skip, limit=limit
        )
        result = []
        for book_data in books_with_stats:
            copy_stats = book_data.pop("copy_stats", {})
            book_with_stats = BookWithStatsResponse(
                **book_data, copy_stats=BookCopyStats(**copy_stats)
            )
            result.append(book_with_stats)
        return result

    async def RetrieveBooksWithStatsAndCourses(
        self, skip: int = 0, limit: int = 100
    ) -> List[BookWithStatsAndCoursesResponse]:
        """Get books with copy statistics and associated courses"""
        books_data = await self.broker.SelectAllBooksWithStatsAndCourses(
            skip=skip, limit=limit
        )
        result = []
        for book_data in books_data:
            copy_stats = book_data.pop("copy_stats", {})
            courses_data = book_data.pop("courses", [])

            book_with_data = BookWithStatsAndCoursesResponse(
                **book_data,
                copy_stats=BookCopyStats(**copy_stats),
                courses=[CourseInfo(**course) for course in courses_data],
            )
            result.append(book_with_data)
        return result
        return result
