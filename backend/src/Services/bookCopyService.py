from typing import List, Optional
from uuid import UUID
from ..Models.Books import BookCopyCreate, BookCopyResponse, BookCopyUpdate, BookStatus
from ..Brokers.bookCopyBroker import BookCopyBroker


class BookCopyService:
    def __init__(self, broker: BookCopyBroker):
        self.broker = broker

    async def get_all_copies(self, skip: int = 0, limit: int = 10) -> List[BookCopyResponse]:
        """Get all book copies with pagination"""
        copies = await self.broker.select_all_copies(skip=skip, limit=limit)
        return [BookCopyResponse(**copy) for copy in copies]
    
    async def get_copies_by_book_id(self, book_id: UUID) -> List[BookCopyResponse]:
        """Get all copies of a specific book"""
        copies = await self.broker.select_copies_by_book_id(book_id)
        return [BookCopyResponse(**copy) for copy in copies]
    
    async def get_available_copies_by_book_id(self, book_id: UUID) -> List[BookCopyResponse]:
        """Get all available copies of a specific book"""
        copies = await self.broker.select_available_copies_by_book_id(book_id)
        return [BookCopyResponse(**copy) for copy in copies]
    
    async def get_copy_by_id(self, copy_id: UUID) -> Optional[BookCopyResponse]:
        """Get a specific copy by ID"""
        copy_data = await self.broker.select_copy_by_id(copy_id)
        return BookCopyResponse(**copy_data) if copy_data else None
    
    async def get_copy_by_accession_number(self, accession_number: int) -> Optional[BookCopyResponse]:
        """Get a copy by barcode/accession number"""
        copy_data = await self.broker.select_copy_by_accession_number(accession_number)
        return BookCopyResponse(**copy_data) if copy_data else None
    
    async def get_copy_stats(self, book_id: UUID) -> dict:
        """Get statistics for book copies"""
        return await self.broker.count_copies_by_book_id(book_id)
    
    async def create_single_copy(self, copy: BookCopyCreate) -> BookCopyResponse:
        """Create a single book copy manually"""
        copy_data = copy.model_dump()
        # Convert UUID to string for JSON serialization
        copy_data['book_id'] = str(copy_data['book_id'])
        created_copy = await self.broker.insert_copy(copy_data)
        return BookCopyResponse(**created_copy)
    
    async def create_bulk_copies(
        self, 
        book_id: UUID, 
        quantity: int, 
        reference_percentage: int = 30
    ) -> List[BookCopyResponse]:
        """
        Create multiple copies at once with automatic reference/circulating split
        
        Args:
            book_id: The book to create copies for
            quantity: Total number of copies to create
            reference_percentage: Percentage to mark as reference (default 30%)
        
        Returns:
            List of created book copies
        """
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        
        if reference_percentage < 0 or reference_percentage > 100:
            raise ValueError("Reference percentage must be between 0 and 100")
        
        # Calculate how many should be reference
        reference_count = int((quantity * reference_percentage) / 100)
        circulating_count = quantity - reference_count
        
        # Prepare copy data
        copies_data = []
        
        # Add reference copies first
        for _ in range(reference_count):
            copies_data.append({
                "book_id": str(book_id),
                "is_reference": True,
                "status": "available"
            })
        
        # Add circulating copies
        for _ in range(circulating_count):
            copies_data.append({
                "book_id": str(book_id),
                "is_reference": False,
                "status": "available"
            })
        
        # Insert all at once
        created_copies = await self.broker.insert_copies_bulk(copies_data)
        return [BookCopyResponse(**copy) for copy in created_copies]
    
    async def update_copy(self, copy_id: UUID, copy_update: BookCopyUpdate) -> Optional[BookCopyResponse]:
        """Update a book copy (status, reference flag, etc.)"""
        existing_copy = await self.broker.select_copy_by_id(copy_id)
        if not existing_copy:
            return None
        
        update_data = copy_update.model_dump(exclude_unset=True)
        updated_copy = await self.broker.update_copy(copy_id, update_data)
        return BookCopyResponse(**updated_copy) if updated_copy else None
    
    async def update_copy_status(self, copy_id: UUID, status: BookStatus) -> Optional[BookCopyResponse]:
        """Quick status update (available, maintenance, lost)"""
        return await self.update_copy(copy_id, BookCopyUpdate(status=status))
    
    async def delete_copy(self, copy_id: UUID) -> bool:
        """Delete a book copy"""
        return await self.broker.delete_copy(copy_id)
