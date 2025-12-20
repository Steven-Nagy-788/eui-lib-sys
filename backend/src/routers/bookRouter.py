from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID

from ..dependencies import get_book_service
from ..Services.bookService import BookService
from ..Models.Books import BookCreate, BookResponse

router = APIRouter(
    prefix="/books",
    tags=["books"]
)


@router.get("/", response_model=List[BookResponse])
async def get_books(
    skip: int = 0,
    limit: int = 10,
    service: BookService = Depends(get_book_service)
):
    return await service.get_all_books(skip=skip, limit=limit)


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: UUID,
    service: BookService = Depends(get_book_service)
):
    book = await service.get_book_by_id(book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book: BookCreate,
    service: BookService = Depends(get_book_service)
):
    """Create a new book"""
    try:
        new_book = await service.create_book(book)
        return new_book
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: UUID,
    book: BookCreate,
    service: BookService = Depends(get_book_service)
):
    """Update an existing book"""
    try:
        updated_book = await service.update_book(book_id, book)
        if updated_book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Book with id {book_id} not found"
            )
        return updated_book
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: UUID,
    service: BookService = Depends(get_book_service)
):
    """Delete a book"""
    success = await service.delete_book(book_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found"
        )
    return None
