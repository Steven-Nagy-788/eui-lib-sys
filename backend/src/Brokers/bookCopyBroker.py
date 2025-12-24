import asyncio
from supabase import Client
from typing import Optional, List
from uuid import UUID


class BookCopyBroker:
    def __init__(self, client: Client):
        self.client = client

    async def SelectAllCopies(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Get all book copies with pagination"""

        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .range(skip, skip + limit - 1)
                .execute()
            )

        copies = await asyncio.to_thread(_fetch)
        return copies.data

    async def SelectCopiesByBookId(self, book_id: UUID) -> list[dict]:
        """Get all copies of a specific book"""

        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .eq("book_id", str(book_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectCopiesByBookIdWithBorrowerInfo(
        self, book_id: UUID, available_only: bool = False
    ) -> list[dict]:
        """Get copies with borrower information"""

        def _fetch():
            query = (
                self.client.table("book_copies")
                .select(
                    "*,"
                    "loans!left(id, user_id, status, users!left(full_name, university_id))"
                )
                .eq("book_id", str(book_id))
            )

            if available_only:
                query = query.eq("is_reference", False).eq("status", "available")

            return query.execute()

        response = await asyncio.to_thread(_fetch)
        if not response.data:
            return []

        # Flatten and filter to only include active loans
        result = []
        for copy in response.data:
            loans = copy.pop("loans", [])
            # Find active loan
            active_loan = (
                next((loan for loan in loans if loan.get("status") == "active"), None)
                if loans
                else None
            )

            flattened = {
                **copy,
                "current_borrower_name": None,
                "current_borrower_id": None,
                "current_loan_id": None,
            }

            if active_loan:
                user = active_loan.get("users", {}) if active_loan else {}
                flattened["current_borrower_name"] = (
                    user.get("full_name") if user else None
                )
                flattened["current_borrower_id"] = (
                    user.get("university_id") if user else None
                )
                flattened["current_loan_id"] = active_loan.get("id")

            result.append(flattened)

        return result

    async def SelectAvailableCopiesByBookId(self, book_id: UUID) -> list[dict]:
        """Get all available copies of a specific book"""

        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .eq("book_id", str(book_id))
                .eq("status", "available")
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data if response.data else []

    async def SelectCopyById(self, copy_id: UUID) -> Optional[dict]:
        """Get a specific copy by ID"""

        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .eq("id", str(copy_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def SelectCopyByAccessionNumber(
        self, accession_number: int
    ) -> Optional[dict]:
        """Get a copy by its barcode/accession number"""

        def _fetch():
            return (
                self.client.table("book_copies")
                .select("*")
                .eq("accession_number", accession_number)
                .execute()
            )

        response = await asyncio.to_thread(_fetch)
        return response.data[0] if response.data else None

    async def InsertCopy(self, copy_data: dict) -> dict:
        """Insert a single book copy"""

        def _insert():
            return self.client.table("book_copies").insert(copy_data).execute()

        return (await asyncio.to_thread(_insert)).data[0]

    async def InsertCopiesBulk(self, copies_data: List[dict]) -> List[dict]:
        """Insert multiple book copies at once"""

        def _insert():
            return self.client.table("book_copies").insert(copies_data).execute()

        result = await asyncio.to_thread(_insert)
        return result.data

    async def UpdateCopy(self, copy_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book copy by ID"""

        def _update():
            return (
                self.client.table("book_copies")
                .update(update_data)
                .eq("id", str(copy_id))
                .execute()
            )

        response = await asyncio.to_thread(_update)
        if response.data:
            return response.data[0]
        return None

    async def UpdateCopyStatus(self, copy_id: UUID, status: str) -> Optional[dict]:
        """Update a book copy's status"""
        return await self.UpdateCopy(copy_id, {"status": status})

    async def DeleteCopy(self, copy_id: UUID) -> bool:
        """Delete a book copy"""

        def _delete():
            return (
                self.client.table("book_copies")
                .delete()
                .eq("id", str(copy_id))
                .execute()
            )

        result = await asyncio.to_thread(_delete)
        return len(result.data) > 0

    async def CountCopiesByBookId(self, book_id: UUID) -> dict:
        """Count total, available, and reference copies for a book"""

        def _fetch_all():
            # Fetch copies with their active loans
            return (
                self.client.table("book_copies")
                .select("*," "loans!left(id, status)")
                .eq("book_id", str(book_id))
                .execute()
            )

        response = await asyncio.to_thread(_fetch_all)
        copies = response.data if response.data else []

        total = len(copies)
        # Count as available only if status is 'available' AND no active/pending_pickup loans
        available = 0
        for c in copies:
            if c.get("status") == "available":
                loans = c.get("loans", [])
                # Check if there are any active or pending_pickup loans
                has_active_loan = any(
                    loan.get("status") in ["active", "pending_pickup"] for loan in loans
                )
                if not has_active_loan:
                    available += 1

        reference = sum(1 for c in copies if c.get("is_reference") is True)

        return {
            "total": total,
            "available": available,
            "reference": reference,
            "circulating": total - reference,
        }
