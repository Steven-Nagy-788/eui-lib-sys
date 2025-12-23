from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID

from ..utils.dependencies import get_book_service
from ..utils.auth import require_admin, get_current_user
from ..Services.bookService import BookService
from ..Models.Books import BookCreate, BookResponse, BookWithStatsResponse, BookCopyStats

router = APIRouter(
    prefix="/books",
    tags=["books"]
)


@router.get("/", response_model=List[BookResponse])
async def get_books(
    skip: int = 0,
    limit: int = 10,
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(get_current_user)
):
    return await service.RetrieveAllBooks(skip=skip, limit=limit)


@router.get("/with-stats", response_model=List[BookWithStatsResponse])
async def get_books_with_stats(
    skip: int = 0,
    limit: int = 50,
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(get_current_user)
):
    """Get books with copy statistics in one call"""
    return await service.RetrieveBooksWithStats(skip=skip, limit=limit)


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: UUID,
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(get_current_user)
):
    book = await service.RetrieveBookById(book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book: BookCreate,
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(require_admin)
):
    """Create a new book (Admin only)"""
    try:
        new_book = await service.AddBook(book)
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
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(require_admin)
):
    """Update a book (Admin only)"""
    try:
        updated_book = await service.ModifyBook(book_id, book)
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


@router.patch("/{book_id}", response_model=BookResponse)
async def partial_update_book(
    book_id: UUID,
    book: BookCreate,
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(require_admin)
):
    """Partially update a book (Admin only)"""
    """Update an existing book"""
    try:
        updated_book = await service.ModifyBook(book_id, book)
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
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(require_admin)
):
    """Delete a book (Admin only)"""
    success = await service.RemoveBook(book_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with id {book_id} not found"
        )
    return None


@router.get("/search/", response_model=List[BookResponse])
async def search_books(
    q: str,
    service: BookService = Depends(get_book_service),
    current_user: dict = Depends(get_current_user)
):
    """Search books by title, author, or ISBN"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters"
        )
    return await service.SearchBooks(q)
