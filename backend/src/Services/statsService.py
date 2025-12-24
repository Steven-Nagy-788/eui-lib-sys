from typing import List
from ..Brokers.statsBroker import StatsBroker


class StatsService:
    def __init__(self, broker: StatsBroker):
        self.broker = broker

    # ==================== DASHBOARD STATISTICS ====================

    async def get_dashboard_stats(self) -> dict:
        """Get comprehensive dashboard statistics"""
        return {
            "books": {
                "total_books": await self.broker.get_total_books(),
                "total_copies": await self.broker.get_total_copies(),
                "available_copies": await self.broker.get_available_copies(),
                "copies_by_status": await self.broker.get_books_by_status(),
            },
            "users": {
                "total_users": await self.broker.get_total_users(),
                "users_by_role": await self.broker.get_users_by_role(),
                "blacklisted_users": await self.broker.get_blacklisted_users_count(),
            },
            "loans": {
                "active_loans": await self.broker.get_total_active_loans(),
                "overdue_loans": await self.broker.get_total_overdue_loans(),
                "pending_requests": await self.broker.get_total_pending_requests(),
                "loans_by_status": await self.broker.get_loans_by_status(),
            },
        }

    # ==================== BOOK STATISTICS ====================

    async def get_book_stats(self) -> dict:
        """Get detailed book statistics"""
        return {
            "total_books": await self.broker.get_total_books(),
            "total_copies": await self.broker.get_total_copies(),
            "available_copies": await self.broker.get_available_copies(),
            "copies_by_status": await self.broker.get_books_by_status(),
            "most_borrowed": await self.broker.get_most_borrowed_books(limit=10),
        }

    async def get_most_borrowed_books(self, limit: int = 10) -> List[dict]:
        """Get most borrowed books"""
        return await self.broker.get_most_borrowed_books(limit)

    # ==================== LOAN STATISTICS ====================

    async def get_loan_stats(self, year: int = None) -> dict:
        """Get detailed loan statistics"""
        return {
            "active_loans": await self.broker.get_total_active_loans(),
            "overdue_loans": await self.broker.get_total_overdue_loans(),
            "pending_requests": await self.broker.get_total_pending_requests(),
            "loans_by_status": await self.broker.get_loans_by_status(),
            "loans_by_month": await self.broker.get_loans_by_month(year),
            "top_borrowers": await self.broker.get_top_borrowers(limit=10),
        }

    async def get_loans_by_month(self, year: int = None) -> List[dict]:
        """Get loan count by month"""
        return await self.broker.get_loans_by_month(year)

    async def get_top_borrowers(self, limit: int = 10) -> List[dict]:
        """Get top borrowers"""
        return await self.broker.get_top_borrowers(limit)

    # ==================== USER STATISTICS ====================

    async def get_user_stats(self) -> dict:
        """Get detailed user statistics"""
        return {
            "total_users": await self.broker.get_total_users(),
            "users_by_role": await self.broker.get_users_by_role(),
            "blacklisted_users": await self.broker.get_blacklisted_users_count(),
            "users_with_infractions": await self.broker.get_users_with_infractions(),
        }

    async def get_users_with_infractions(self) -> List[dict]:
        """Get users with infractions"""
        return await self.broker.get_users_with_infractions()
