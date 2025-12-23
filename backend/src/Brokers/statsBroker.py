import asyncio
from supabase import Client
from typing import Optional
from datetime import datetime
from fastapi import HTTPException


class StatsBroker:
    def __init__(self, client: Client):
        self.client = client

    # ==================== DASHBOARD STATISTICS ====================
    
    async def get_total_books(self) -> int:
        """Get total number of books in catalog"""
        def _fetch():
            return self.client.table("books").select("id", count="exact").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_total_copies(self) -> int:
        """Get total number of book copies"""
        def _fetch():
            return self.client.table("book_copies").select("id", count="exact").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_available_copies(self) -> int:
        """Get number of available copies"""
        def _fetch():
            return self.client.table("book_copies").select("id", count="exact").eq("status", "available").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_total_users(self) -> int:
        """Get total number of users"""
        def _fetch():
            return self.client.table("users").select("id", count="exact").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_users_by_role(self) -> dict:
        """Get user count grouped by role"""
        def _fetch():
            return self.client.table("users").select("role").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            users = response.data if response.data else []
            
            # Count by role
            role_counts = {}
            for user in users:
                role = user.get("role", "unknown")
                role_counts[role] = role_counts.get(role, 0) + 1
            
            return role_counts
        except Exception:
            return {}
    
    async def get_total_active_loans(self) -> int:
        """Get number of currently active loans"""
        def _fetch():
            return self.client.table("loans").select("id", count="exact").eq("status", "active").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_total_overdue_loans(self) -> int:
        """Get number of overdue loans"""
        def _fetch():
            return self.client.table("loans").select("id", count="exact").eq("status", "overdue").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_total_pending_requests(self) -> int:
        """Get number of pending loan requests"""
        def _fetch():
            return self.client.table("loans").select("id", count="exact").eq("status", "pending").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0
    
    async def get_blacklisted_users_count(self) -> int:
        """Get number of blacklisted users"""
        def _fetch():
            return self.client.table("users").select("id", count="exact").eq("is_blacklisted", True).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.count if response.count else 0
        except Exception:
            return 0

    # ==================== BOOK STATISTICS ====================
    
    async def get_most_borrowed_books(self, limit: int = 10) -> list[dict]:
        """Get most borrowed books with their borrow count"""
        def _fetch():
            # Get all loans with book information via JOIN
            return self.client.table("loans").select(
                "copy_id, book_copies!inner(book_id, books!inner(id, title, author, isbn))"
            ).in_("status", ["active", "returned", "overdue"]).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            loans = response.data if response.data else []
            
            # Count by book_id (not copy_id to avoid duplicates)
            book_counts = {}
            book_details = {}
            
            for loan in loans:
                copy_info = loan.get("book_copies", {})
                if copy_info:
                    book_id = copy_info.get("book_id")
                    book_info = copy_info.get("books", {})
                    
                    if book_id:
                        # Increment count
                        book_counts[str(book_id)] = book_counts.get(str(book_id), 0) + 1
                        
                        # Store book details (only once per book)
                        if str(book_id) not in book_details and book_info:
                            book_details[str(book_id)] = {
                                "book_id": book_id,
                                "title": book_info.get("title", "Unknown"),
                                "author": book_info.get("author", "Unknown"),
                                "isbn": book_info.get("isbn", "")
                            }
            
            # Sort by borrow count and get top books
            top_books = sorted(book_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            
            # Build result with book details and counts
            result = []
            for book_id, count in top_books:
                if book_id in book_details:
                    result.append({
                        **book_details[book_id],
                        "borrow_count": count
                    })
            
            return result
        except Exception as e:
            # Fallback to old method if JOIN fails
            return await self._get_most_borrowed_books_fallback(limit)
    
    async def _get_most_borrowed_books_fallback(self, limit: int = 10) -> list[dict]:
        """Fallback method for most borrowed books"""
        def _fetch():
            return self.client.table("loans").select("copy_id").in_("status", ["active", "returned", "overdue"]).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            loans = response.data if response.data else []
            
            # Get book_id for each copy and count by book_id
            book_counts = {}
            
            for loan in loans:
                copy_id = loan.get("copy_id")
                if copy_id:
                    # Get copy info
                    copy_response = await asyncio.to_thread(
                        lambda cid=copy_id: self.client.table("book_copies").select("book_id").eq("id", str(cid)).execute()
                    )
                    if copy_response.data:
                        book_id = str(copy_response.data[0].get("book_id"))
                        book_counts[book_id] = book_counts.get(book_id, 0) + 1
            
            # Get top books
            top_books = sorted(book_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            
            # Fetch book details
            result = []
            for book_id, count in top_books:
                book_response = await asyncio.to_thread(
                    lambda bid=book_id: self.client.table("books").select("*").eq("id", bid).execute()
                )
                if book_response.data:
                    book = book_response.data[0]
                    result.append({
                        "book_id": book_id,
                        "title": book.get("title", "Unknown"),
                        "author": book.get("author", "Unknown"),
                        "isbn": book.get("isbn", ""),
                        "borrow_count": count
                    })
            
            return result
        except Exception:
            return []
    
    async def get_books_by_status(self) -> dict:
        """Get book copy count by status"""
        def _fetch():
            return self.client.table("book_copies").select("status").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            copies = response.data if response.data else []
            
            # Count by status
            status_counts = {"available": 0, "checked_out": 0, "lost": 0, "damaged": 0}
            for copy in copies:
                status = copy.get("status", "available")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return status_counts
        except Exception:
            return {"available": 0, "checked_out": 0, "lost": 0, "damaged": 0}

    # ==================== LOAN STATISTICS ====================
    
    async def get_loans_by_status(self) -> dict:
        """Get loan count by status"""
        def _fetch():
            return self.client.table("loans").select("status").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            loans = response.data if response.data else []
            
            # Count by status
            status_counts = {"pending": 0, "active": 0, "returned": 0, "overdue": 0, "rejected": 0}
            for loan in loans:
                status = loan.get("status", "pending")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return status_counts
        except Exception:
            return {"pending": 0, "active": 0, "returned": 0, "overdue": 0, "rejected": 0}
    
    async def get_loans_by_month(self, year: int = None) -> list[dict]:
        """Get loan count by month for the current or specified year"""
        if year is None:
            year = datetime.now().year
        
        def _fetch():
            return self.client.table("loans").select("request_date").gte("request_date", f"{year}-01-01").lte("request_date", f"{year}-12-31").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            loans = response.data if response.data else []
            
            # Count by month
            month_counts = {i: 0 for i in range(1, 13)}
            for loan in loans:
                request_date = loan.get("request_date")
                if request_date:
                    try:
                        month = datetime.fromisoformat(request_date.replace("Z", "+00:00")).month
                        month_counts[month] = month_counts.get(month, 0) + 1
                    except:
                        continue
            
            # Format result
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            return [
                {"month": month_names[i], "count": month_counts[i+1]}
                for i in range(12)
            ]
        except Exception:
            return []
    
    async def get_top_borrowers(self, limit: int = 10) -> list[dict]:
        """Get users with most loans"""
        def _fetch():
            return self.client.table("loans").select("user_id").execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            loans = response.data if response.data else []
            
            # Count by user_id
            user_counts = {}
            for loan in loans:
                user_id = loan.get("user_id")
                if user_id:
                    user_counts[user_id] = user_counts.get(user_id, 0) + 1
            
            # Get top users
            top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            
            # Fetch user details
            result = []
            for user_id, count in top_users:
                user_response = await asyncio.to_thread(
                    lambda: self.client.table("users").select("full_name, university_id, role, email").eq("id", user_id).execute()
                )
                if user_response.data:
                    user = user_response.data[0]
                    result.append({
                        "user_id": user_id,
                        "full_name": user.get("full_name"),
                        "email": user.get("email"),
                        "university_id": user.get("university_id"),
                        "role": user.get("role"),
                        "loan_count": count
                    })
            
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")

    # ==================== USER STATISTICS ====================
    
    async def get_users_with_infractions(self) -> list[dict]:
        """Get users with infractions > 0"""
        def _fetch():
            return self.client.table("users").select("id, full_name, university_id, infractions_count").gt("infractions_count", 0).execute()
        
        try:
            response = await asyncio.to_thread(_fetch)
            return response.data if response.data else []
        except Exception:
            return []
