from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from uuid import UUID

from ..dependencies import get_book_copy_service
from ..Services.bookCopyService import BookCopyService
from ..Models.Books import (
    BookCopyCreate, 
    BookCopyResponse, 
    BookCopyUpdate, 
    BookStatus,
    AddInventoryRequest
)

router = APIRouter(
    prefix="/book-copies",
    tags=["book-copies"]
)


@router.get("/", response_model=List[BookCopyResponse])
async def get_all_copies(
    skip: int = 0,
    limit: int = 100,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Get all book copies with pagination"""
    return await service.get_all_copies(skip=skip, limit=limit)


@router.get("/book/{book_id}", response_model=List[BookCopyResponse])
async def get_copies_by_book(
    book_id: UUID,
    available_only: bool = Query(False, description="Filter to only available copies"),
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Get all copies of a specific book"""
    if available_only:
        return await service.get_available_copies_by_book_id(book_id)
    return await service.get_copies_by_book_id(book_id)


@router.get("/book/{book_id}/stats")
async def get_copy_stats(
    book_id: UUID,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Get statistics for book copies (total, available, reference, circulating)"""
    return await service.get_copy_stats(book_id)


@router.get("/accession/{accession_number}", response_model=BookCopyResponse)
async def get_copy_by_barcode(
    accession_number: int,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Get a copy by its barcode/accession number (for scanner input)"""
    copy = await service.get_copy_by_accession_number(accession_number)
    if copy is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Copy with accession number {accession_number} not found"
        )
    return copy


@router.get("/{copy_id}", response_model=BookCopyResponse)
async def get_copy(
    copy_id: UUID,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Get a specific copy by ID"""
    copy = await service.get_copy_by_id(copy_id)
    if copy is None:
        raise HTTPException(status_code=404, detail="Copy not found")
    return copy


@router.post("/", response_model=BookCopyResponse, status_code=status.HTTP_201_CREATED)
async def create_single_copy(
    copy: BookCopyCreate,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Create a single book copy manually"""
    try:
        new_copy = await service.create_single_copy(copy)
        return new_copy
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/bulk", response_model=List[BookCopyResponse], status_code=status.HTTP_201_CREATED)
async def create_bulk_copies(
    request: AddInventoryRequest,
    reference_percentage: int = Query(30, ge=0, le=100, description="Percentage to mark as reference"),
    service: BookCopyService = Depends(get_book_copy_service)
):
    """
    Create multiple copies at once with automatic reference/circulating split
    
    - **book_id**: The book to create copies for
    - **quantity**: Number of copies to create
    - **reference_percentage**: Percentage to mark as reference (default 30%)
    
    Example: Creating 10 copies with 30% reference will create 3 reference + 7 circulating copies
    """
    try:
        new_copies = await service.create_bulk_copies(
            book_id=request.book_id,
            quantity=request.quantity,
            reference_percentage=reference_percentage
        )
        return new_copies
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{copy_id}", response_model=BookCopyResponse)
async def update_copy(
    copy_id: UUID,
    copy_update: BookCopyUpdate,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Update a book copy (status, reference flag, etc.)"""
    try:
        updated_copy = await service.update_copy(copy_id, copy_update)
        if updated_copy is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Copy with id {copy_id} not found"
            )
        return updated_copy
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{copy_id}/status/{status}")
async def update_copy_status(
    copy_id: UUID,
    status: BookStatus,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Quick status update endpoint (available, maintenance, lost)"""
    updated_copy = await service.update_copy_status(copy_id, status)
    if updated_copy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Copy with id {copy_id} not found"
        )
    return updated_copy


@router.delete("/{copy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_copy(
    copy_id: UUID,
    service: BookCopyService = Depends(get_book_copy_service)
):
    """Delete a book copy"""
    success = await service.delete_copy(copy_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Copy with id {copy_id} not found"
        )
    return None
