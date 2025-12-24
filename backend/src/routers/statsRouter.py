from fastapi import APIRouter, Depends, Query

from ..Services.statsService import StatsService
from ..utils.auth import require_admin
from ..utils.dependencies import get_stats_service

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/dashboard")
async def get_dashboard_stats(
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """
    Get comprehensive dashboard statistics

    Returns:
    - Books: total books, total copies, available copies, copies by status
    - Users: total users, users by role, blacklisted users
    - Loans: active loans, overdue loans, pending requests, loans by status
    """
    return await service.get_dashboard_stats()


@router.get("/books")
async def get_book_stats(
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """
    Get detailed book statistics

    Returns:
    - Total books and copies
    - Available copies
    - Copies by status
    - Most borrowed books (top 10)
    """
    return await service.get_book_stats()


@router.get("/books/most-borrowed")
async def get_most_borrowed_books(
    limit: int = Query(10, ge=1, le=100, description="Number of books to return"),
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """Get most borrowed books"""
    return await service.get_most_borrowed_books(limit)


@router.get("/loans")
async def get_loan_stats(
    year: int = Query(
        None, ge=2000, le=2100, description="Year for monthly statistics"
    ),
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """
    Get detailed loan statistics

    Returns:
    - Active, overdue, and pending loan counts
    - Loans by status
    - Loans by month (for specified year or current year)
    - Top borrowers (top 10)
    """
    return await service.get_loan_stats(year)


@router.get("/loans/by-month")
async def get_loans_by_month(
    year: int = Query(None, ge=2000, le=2100, description="Year for statistics"),
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """Get loan count by month for a specific year"""
    return await service.get_loans_by_month(year)


@router.get("/loans/top-borrowers")
async def get_top_borrowers(
    limit: int = Query(10, ge=1, le=100, description="Number of users to return"),
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """Get users with most loans"""
    return await service.get_top_borrowers(limit)


@router.get("/users")
async def get_user_stats(
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """
    Get detailed user statistics

    Returns:
    - Total users
    - Users by role
    - Blacklisted users count
    - Users with infractions
    """
    return await service.get_user_stats()


@router.get("/users/infractions")
async def get_users_with_infractions(
    service: StatsService = Depends(get_stats_service),
    current_user: dict = Depends(require_admin),
):
    """Get list of users with infractions > 0 (Admin only)"""
    return await service.get_users_with_infractions()
