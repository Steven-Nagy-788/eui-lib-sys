import asyncio
from supabase import Client
from typing import Optional
from uuid import UUID
from datetime import datetime


class LoanBroker:
    def __init__(self, client: Client):
        self.client = client

    # ==================== LOANS ====================

    async def SelectAllLoans(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Get all loans with pagination"""

        def _fetch():
            return (
                self.client.table("loans")
                .select("*")
                .range(skip, skip + limit - 1)
                .execute()
            )

        loans = await asyncio.to_thread(_fetch)
        return loans.data

    async def SelectLoanById(self, loan_id: UUID) -> Optional[dict]:
        """Get a specific loan by ID"""

        def _fetch():
            return (
                self.client.table("loans").select("*").eq("id", str(loan_id)).execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def SelectLoansByUser(
        self, user_id: UUID, status: Optional[str] = None
    ) -> list[dict]:
        """Get all loans for a specific user, optionally filtered by status"""

        def _fetch():
            query = self.client.table("loans").select("*").eq("user_id", str(user_id))
            if status:
                query = query.eq("status", status)
            return query.execute()

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectLoansByUserWithBookInfo(
        self, user_id: UUID, status: Optional[str] = None
    ) -> list[dict]:
        """Get all loans for a user with book details (JOIN)"""

        def _fetch():
            # Use Supabase's JOIN syntax to get book info
            query = (
                self.client.table("loans")
                .select(
                    "*,"
                    "book_copies!inner(accession_number, book_id, books!inner(id, title, author, isbn, publisher, book_pic_url))"
                )
                .eq("user_id", str(user_id))
            )
            if status:
                query = query.eq("status", status)
            return query.order("request_date", desc=True).execute()

        response = await asyncio.to_thread(_fetch)
        if not response.data:
            return []

        # Flatten the nested structure
        result = []
        for loan in response.data:
            book_copy = loan.pop("book_copies", {})
            book = book_copy.get("books", {}) if book_copy else {}

            flattened = {
                **loan,
                "copy_accession_number": (
                    book_copy.get("accession_number") if book_copy else None
                ),
                "book_id": book.get("id") if book else None,
                "book_title": (
                    book.get("title", "Unknown Book") if book else "Unknown Book"
                ),
                "book_author": (
                    book.get("author", "Unknown Author") if book else "Unknown Author"
                ),
                "book_isbn": book.get("isbn", "") if book else "",
                "book_publisher": book.get("publisher") if book else None,
                "book_pic_url": book.get("book_pic_url") if book else None,
            }
            result.append(flattened)

        return result

    async def SelectLoansByCopy(self, copy_id: UUID) -> list[dict]:
        """Get all loans for a specific book copy"""

        def _fetch():
            return (
                self.client.table("loans")
                .select("*")
                .eq("copy_id", str(copy_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectLoansByStatus(
        self, status: str, skip: int = 0, limit: int = 100
    ) -> list[dict]:
        """Get all loans with a specific status"""

        def _fetch():
            return (
                self.client.table("loans")
                .select("*")
                .eq("status", status)
                .range(skip, skip + limit - 1)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectLoansByStatusWithBookInfo(
        self, status: str, skip: int = 0, limit: int = 100
    ) -> list[dict]:
        """Get all loans with a specific status with book details (JOIN)"""

        def _fetch():
            # Use Supabase's JOIN syntax to get book info
            query = (
                self.client.table("loans")
                .select(
                    "*,"
                    "book_copies!inner(accession_number, book_id, books!inner(id, title, author, isbn, publisher, book_pic_url))"
                )
                .eq("status", status)
            )
            return (
                query.range(skip, skip + limit - 1)
                .order("request_date", desc=True)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        if not response.data:
            return []

        # Flatten the nested structure
        result = []
        for loan in response.data:
            book_copy = loan.pop("book_copies", {})
            book = book_copy.get("books", {}) if book_copy else {}

            flattened = {
                **loan,
                "copy_accession_number": (
                    book_copy.get("accession_number") if book_copy else None
                ),
                "book_id": book.get("id") if book else None,
                "book_title": (
                    book.get("title", "Unknown Book") if book else "Unknown Book"
                ),
                "book_author": (
                    book.get("author", "Unknown Author") if book else "Unknown Author"
                ),
                "book_isbn": book.get("isbn", "") if book else "",
                "book_publisher": book.get("publisher") if book else None,
                "book_pic_url": book.get("book_pic_url") if book else None,
            }
            result.append(flattened)

        return result

    async def SelectActiveLoansByUser(self, user_id: UUID) -> list[dict]:
        """Get all active loans for a user (pending, pending_pickup, or active status)"""

        def _fetch():
            return (
                self.client.table("loans")
                .select("*")
                .eq("user_id", str(user_id))
                .in_("status", ["pending", "pending_pickup", "active"])
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def CheckUserHasCopyOnLoan(self, user_id: UUID, copy_id: UUID) -> bool:
        """Check if user already has this specific copy on loan (active, pending, or pending_pickup)"""

        def _fetch():
            return (
                self.client.table("loans")
                .select("id")
                .eq("user_id", str(user_id))
                .eq("copy_id", str(copy_id))
                .in_("status", ["pending", "pending_pickup", "active"])
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return len(response.data) > 0

    async def SelectOverdueLoans(self) -> list[dict]:
        """Get all loans that are overdue (due_date < now and status = active)"""

        def _fetch():
            now = datetime.utcnow().isoformat()
            return (
                self.client.table("loans")
                .select("*")
                .eq("status", "active")
                .lt("due_date", now)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def InsertLoan(self, loan_data: dict) -> dict:
        """Insert a new loan request"""

        def _insert():
            return self.client.table("loans").insert(loan_data).execute()

        return (await asyncio.to_thread(_insert)).data[0]

    async def UpdateLoan(self, loan_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a loan by ID"""

        def _update():
            return (
                self.client.table("loans")
                .update(update_data)
                .eq("id", str(loan_id))
                .execute()
            )

        response = await asyncio.to_thread(_update)
        if response.data:
            return response.data[0]
        return None

    async def DeleteLoan(self, loan_id: UUID) -> bool:
        """Delete a loan"""

        def _delete():
            return self.client.table("loans").delete().eq("id", str(loan_id)).execute()

        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

    # ==================== LOAN POLICIES ====================

    async def SelectLoanPolicy(self, role: str) -> Optional[dict]:
        """Get loan policy for a specific role"""

        def _fetch():
            return (
                self.client.table("loan_policies")
                .select("*")
                .eq("role", role)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def SelectAllLoanPolicies(self) -> list[dict]:
        """Get all loan policies"""

        def _fetch():
            return self.client.table("loan_policies").select("*").execute()

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def UpdateLoanPolicy(self, role: str, update_data: dict) -> Optional[dict]:
        """Update loan policy for a specific role"""

        def _update():
            return (
                self.client.table("loan_policies")
                .update(update_data)
                .eq("role", role)
                .execute()
            )

        response = await asyncio.to_thread(_update)
        return response.data[0] if response.data else None

    async def SearchLoans(
        self,
        user_id: Optional[UUID] = None,
        status: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> list[dict]:
        """Search loans with multiple filters"""

        def _search():
            query = self.client.table("loans").select("*")

            if user_id:
                query = query.eq("user_id", str(user_id))
            if status:
                query = query.eq("status", status)
            if from_date:
                query = query.gte("request_date", from_date)
            if to_date:
                query = query.lte("request_date", to_date)

            return query.execute()

        response = await asyncio.to_thread(_search)
        return response.data if response.data else []
