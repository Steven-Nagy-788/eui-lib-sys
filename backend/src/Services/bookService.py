from typing import List, Optional
from uuid import UUID
from ..Models.Books import BookCreate, BookResponse
from ..Brokers.bookBroker import BookBroker


class BookService:
    def __init__(self, broker: BookBroker):
        self.broker = broker

    async def get_all_books(self, skip: int = 0, limit: int = 10) -> List[BookResponse]:
        return [BookResponse(**book) for book in await self.broker.select_all_books(skip=skip, limit=limit)]
    
    async def get_book_by_id(self, book_id: UUID) -> Optional[BookResponse]:
        book_data = await self.broker.select_book_by_id(book_id)
        return BookResponse(**book_data) if book_data is not None else None
    
    async def create_book(self, book: BookCreate) -> BookResponse:
        existing_book = await self.broker.select_book_by_isbn(book.isbn)
        if existing_book:
            raise ValueError(f"ISBN {book.isbn} already exists")
        book_data = book.model_dump()
        return BookResponse(**await self.broker.insert_book(book_data))
    
    async def update_book(self, book_id: UUID, book: BookCreate) -> Optional[BookResponse]: 
        if not await self.broker.select_book_by_id(book_id):
            return None
        update_data = book.model_dump(exclude_unset=True)
        updated_book = await self.broker.update_book(book_id, update_data)
        return BookResponse(**updated_book) if updated_book is not None else None
        
    async def delete_book(self, book_id: UUID) -> bool:
        return await self.broker.delete_book(book_id)
