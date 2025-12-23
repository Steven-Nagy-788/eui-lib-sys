import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID

class BookBroker:
    def __init__(self, client: Client):
        self.client = client

    async def SelectAllBooks(self, skip: int = 0, limit: int = 10) -> list[dict]:
        def _fetch():
            return self.client.table("books").select("*").range(skip, skip + limit - 1).execute()  
        books = await asyncio.to_thread(_fetch)      
        return books.data
    
    async def SelectBookById(self, book_id: UUID) -> Optional[dict]:
        def _fetch():
            return self.client.table("books").select("*").eq("id", str(book_id)).execute()
        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None
    
    async def SelectBookByIsbn(self, isbn: str) -> Optional[dict]:
        """Get a book by ISBN"""
        def _fetch():
            return self.client.table("books").select("*").eq("isbn", isbn).execute()
        
        response = await asyncio.to_thread(_fetch)
        if response.data:
            return response.data[0]
        return None

    async def InsertBook(self, book_data: dict) -> dict:
        def _insert():
            return self.client.table("books").insert(book_data).execute()
        return (await asyncio.to_thread(_insert)).data[0]
    
    async def UpdateBook(self, book_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book by ID"""
        def _update():
            return self.client.table("books").update(update_data).eq("id", str(book_id)).execute()
        
        response = await asyncio.to_thread(_update)
        if response.data:
            return response.data[0]
        return None
    
    async def DeleteBook(self, book_id: UUID) -> bool:
        def _delete():
            return self.client.table("books").delete().eq("id", str(book_id)).execute()
        response = await asyncio.to_thread(_delete)
        return len(response.data) > 0
    
    async def SearchBooks(self, query: str) -> list[dict]:
        """Search books by title, author, or ISBN (case-insensitive)"""
        def _search():
            # Search in title, author, and ISBN fields
            return self.client.table("books").select("*").or_(
                f"title.ilike.%{query}%,"
                f"author.ilike.%{query}%,"
                f"isbn.ilike.%{query}%"
            ).execute()
        
        response = await asyncio.to_thread(_search)
        return response.data if response.data else []
    
    async def SelectAllBooksWithStats(self, skip: int = 0, limit: int = 50) -> list[dict]:
        """Get all books with copy statistics in a single query using RPC"""
        def _fetch():
            # Use a custom RPC function to get books with stats efficiently
            return self.client.rpc(
                'get_books_with_stats',
                {'offset_param': skip, 'limit_param': limit}
            ).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.data if response.data else []
        except Exception:
            # Fallback: Fetch books and calculate stats manually
            return await self._fetch_books_with_stats_fallback(skip, limit)
    
    async def _fetch_books_with_stats_fallback(self, skip: int, limit: int) -> list[dict]:
        """Fallback method to calculate stats manually if RPC doesn't exist"""
        def _fetch_books():
            return self.client.table("books").select("*").range(skip, skip + limit - 1).execute()
        
        def _fetch_copies(book_id: str):
            return self.client.table("book_copies").select("*").eq("book_id", book_id).execute()
        
        books_response = await asyncio.to_thread(_fetch_books)
        books = books_response.data if books_response.data else []
        
        result = []
        for book in books:
            copies_response = await asyncio.to_thread(_fetch_copies, str(book['id']))
            copies = copies_response.data if copies_response.data else []
            
            total = len(copies)
            # Available: ONLY circulating copies with status='available'
            available = sum(1 for c in copies if not c.get('is_reference', False) and c.get('status') == 'available')
            reference = sum(1 for c in copies if c.get('is_reference', False))
            circulating = sum(1 for c in copies if not c.get('is_reference', False))
            checked_out = sum(1 for c in copies if c.get('status') == 'loaned')
            
            book_with_stats = {
                **book,
                'copy_stats': {
                    'total': total,
                    'available': available,
                    'reference': reference,
                    'circulating': circulating,
                    'checked_out': checked_out
                }
            }
            result.append(book_with_stats)
        
        return result
    
    async def SelectAllBooksWithStatsAndCourses(self, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get all books with copy statistics and associated courses"""
        def _fetch_books():
            return self.client.table("books").select("*").range(skip, skip + limit - 1).execute()
        
        def _fetch_copies(book_id: str):
            return self.client.table("book_copies").select("*").eq("book_id", book_id).execute()
        
        def _fetch_course_books(book_id: str):
            return self.client.table("course_books").select("course_code").eq("book_id", book_id).execute()
        
        def _fetch_course_info(course_code: str):
            return self.client.table("courses").select("*").eq("code", course_code).execute()
        
        books_response = await asyncio.to_thread(_fetch_books)
        books = books_response.data if books_response.data else []
        
        result = []
        for book in books:
            book_id = str(book['id'])
            
            # Fetch copy stats
            copies_response = await asyncio.to_thread(_fetch_copies, book_id)
            copies = copies_response.data if copies_response.data else []
            
            total = len(copies)
            available = sum(1 for c in copies if not c.get('is_reference', False) and c.get('status') == 'available')
            reference = sum(1 for c in copies if c.get('is_reference', False))
            circulating = sum(1 for c in copies if not c.get('is_reference', False))
            checked_out = sum(1 for c in copies if c.get('status') == 'loaned')
            
            # Fetch associated courses
            course_books_response = await asyncio.to_thread(_fetch_course_books, book_id)
            course_books = course_books_response.data if course_books_response.data else []
            
            courses = []
            for cb in course_books:
                course_code = cb.get('course_code')
                if course_code:
                    course_response = await asyncio.to_thread(_fetch_course_info, course_code)
                    if course_response.data:
                        course_data = course_response.data[0]
                        courses.append({
                            'course_code': course_data.get('code', ''),
                            'course_name': course_data.get('name', ''),
                            'faculty': course_data.get('faculty'),
                            'term': course_data.get('term')
                        })
            
            book_with_data = {
                **book,
                'copy_stats': {
                    'total': total,
                    'available': available,
                    'reference': reference,
                    'circulating': circulating,
                    'checked_out': checked_out
                },
                'courses': courses
            }
            result.append(book_with_data)
        
        return result
