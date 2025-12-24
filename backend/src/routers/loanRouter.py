from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..Models.Loans import (
    LoanPolicyResponse,
    LoanResponse,
    LoanStatus,
    LoanUpdate,
    LoanWithBookInfo,
)
from ..Services.loanService import LoanService
from ..utils.auth import get_current_user, require_admin
from ..utils.dependencies import get_loan_service

router = APIRouter(prefix="/loans", tags=["loans"])

# ==================== LOAN QUERIES ====================


@router.get("/", response_model=List[LoanResponse])
async def get_all_loans(
    skip: int = 0,
    limit: int = 100,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get all loans with pagination"""
    return await service.get_all_loans(skip=skip, limit=limit)


@router.get("/status/{status}", response_model=List[LoanWithBookInfo])
async def get_loans_by_status(
    status: LoanStatus,
    skip: int = 0,
    limit: int = 100,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get all loans with a specific status with book and user details"""
    return await service.get_loans_by_status_with_book_info(status, skip, limit)


@router.get("/user/{user_id}", response_model=List[LoanWithBookInfo])
async def get_user_loans(
    user_id: UUID,
    status: Optional[str] = Query(None, description="Filter by status"),
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get all loans for a specific user with book details"""
    return await service.get_loans_by_user_with_book_info(user_id, status)


@router.get("/overdue", response_model=List[LoanResponse])
async def get_overdue_loans(
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get all loans that are overdue"""
    return await service.get_overdue_loans()


@router.get("/calculate-due-date/{copy_id}")
async def calculate_due_date(
    copy_id: UUID,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Calculate due date for a book copy based on user role and course enrollment"""
    try:
        from uuid import UUID

        user_id = UUID(current_user["id"])
        calculation = await service.get_due_date_calculation(user_id, copy_id)
        return calculation
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(
    loan_id: UUID,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get a specific loan by ID"""
    loan = await service.get_loan_by_id(loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


# ==================== LOAN POLICIES ====================


@router.get("/policies/all", response_model=List[LoanPolicyResponse])
async def get_all_loan_policies(
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get all loan policies (max books and loan duration by role)"""
    return await service.get_all_loan_policies()


@router.get("/policies/{role}", response_model=LoanPolicyResponse)
async def get_loan_policy(
    role: str,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """Get loan policy for a specific role"""
    policy = await service.get_loan_policy(role)
    if policy is None:
        raise HTTPException(
            status_code=404, detail=f"Loan policy for role '{role}' not found"
        )
    return policy


# ==================== LOAN CREATION ====================


@router.post(
    "/request", response_model=LoanResponse, status_code=status.HTTP_201_CREATED
)
async def create_loan_request(
    copy_id: UUID = Query(..., description="ID of the book copy to request"),
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new loan request

    Validation checks:
    - User is not blacklisted
    - User hasn't exceeded max_books limit
    - Copy is available
    - User doesn't already have this copy on loan

    Returns loan with status 'pending' awaiting admin approval
    """
    try:
        from uuid import UUID

        user_id = UUID(current_user["id"])
        new_loan = await service.create_loan_request(user_id, copy_id)
        return new_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== LOAN APPROVAL/REJECTION ====================


@router.post("/{loan_id}/approve", response_model=LoanResponse)
async def approve_loan(
    loan_id: UUID,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(require_admin),
):
    """
    Approve a loan request (Admin only)

    Actions:
    - Calculate due date (with course override if applicable)
    - Update status to 'pending_pickup' (waiting for patron to pick up)
    - Set approval_date and due_date
    """
    try:
        approved_loan = await service.approve_loan(loan_id)
        return approved_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{loan_id}/checkout", response_model=LoanResponse)
async def checkout_loan(
    loan_id: UUID,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(require_admin),
):
    """
    Mark a loan as checked out - patron picked up the book (Admin only)

    Actions:
    - Update status from 'pending_pickup' to 'active' (with patron)
    """
    try:
        checked_out_loan = await service.checkout_loan(loan_id)
        return checked_out_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{loan_id}/reject", response_model=LoanResponse)
async def reject_loan(
    loan_id: UUID,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(require_admin),
):
    """
    Reject a loan request (Admin only - TODO: add auth)

    Updates status to 'rejected'
    """
    try:
        rejected_loan = await service.reject_loan(loan_id)
        return rejected_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{loan_id}/cancel", response_model=LoanResponse)
async def cancel_loan(
    loan_id: UUID,
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Cancel a loan request (User can cancel their own, Admin can cancel any)

    Updates status to 'canceled'
    """
    try:
        # Admin can cancel any loan, users can only cancel their own
        user_id = (
            None if current_user.get("role") == "admin" else UUID(current_user["id"])
        )
        canceled_loan = await service.cancel_loan(loan_id, user_id)
        return canceled_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== LOAN RETURN ====================


@router.post("/{loan_id}/return", response_model=LoanResponse)
async def return_loan(
    loan_id: UUID,
    increment_infractions: bool = Query(
        False, description="Increment user's infractions count if returned late"
    ),
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(require_admin),
):
    """
    Process a book return (Admin only - TODO: add auth)

    Actions:
    - Update loan status to 'returned'
    - Set return_date
    - Update copy status back to 'available'
    - Optionally increment infractions if overdue
    """
    try:
        returned_loan = await service.return_loan(loan_id, increment_infractions)
        return returned_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== OVERDUE MANAGEMENT ====================


@router.post("/mark-overdue", response_model=List[LoanResponse])
async def mark_overdue_loans(
    service: LoanService = Depends(get_loan_service),
    current_user: dict = Depends(require_admin),
):
    """
    Mark all active loans past their due date as overdue (Admin/System only)

    This endpoint should be called by a cron job daily
    """
    updated_loans = await service.mark_overdue_loans()
    return updated_loans


@router.get("/search/", response_model=List[LoanResponse])
async def search_loans(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    from_date: Optional[str] = Query(
        None, description="Filter by request date from (YYYY-MM-DD)"
    ),
    to_date: Optional[str] = Query(
        None, description="Filter by request date to (YYYY-MM-DD)"
    ),
    service: LoanService = Depends(get_loan_service),
):
    """Search loans with multiple filters"""
    return await service.search_loans(user_id, status, from_date, to_date)


# ==================== LOAN UPDATE/DELETE ====================


@router.patch("/{loan_id}", response_model=LoanResponse)
async def update_loan(
    loan_id: UUID,
    loan_update: LoanUpdate,
    service: LoanService = Depends(get_loan_service),
):
    """Update a loan (Admin only - for manual adjustments)"""
    try:
        updated_loan = await service.update_loan(loan_id, loan_update)
        if updated_loan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Loan with id {loan_id} not found",
            )
        return updated_loan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loan(loan_id: UUID, service: LoanService = Depends(get_loan_service)):
    """Delete a loan (Admin only - use with caution)"""
    success = await service.delete_loan(loan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loan with id {loan_id} not found",
        )
    return None
