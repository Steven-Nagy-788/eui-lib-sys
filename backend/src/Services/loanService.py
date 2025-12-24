from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from ..Brokers.bookCopyBroker import BookCopyBroker
from ..Brokers.courseBroker import CourseBroker
from ..Brokers.loanBroker import LoanBroker
from ..Brokers.userBroker import UserBroker
from ..Models.Loans import (LoanPolicyResponse, LoanPolicyUpdate, LoanResponse,
                            LoanStatus, LoanUpdate, LoanWithBookInfo)


class LoanService:
    def __init__(
        self,
        loan_broker: LoanBroker,
        user_broker: UserBroker,
        copy_broker: BookCopyBroker,
        course_broker: CourseBroker,
    ):
        self.loan_broker = loan_broker
        self.user_broker = user_broker
        self.copy_broker = copy_broker
        self.course_broker = course_broker

    # ==================== QUERIES ====================

    async def get_all_loans(self, skip: int = 0, limit: int = 10) -> List[LoanResponse]:
        """Get all loans with pagination"""
        loans = await self.loan_broker.SelectAllLoans(skip=skip, limit=limit)
        return [LoanResponse(**loan) for loan in loans]

    async def get_loan_by_id(self, loan_id: UUID) -> Optional[LoanResponse]:
        """Get a specific loan by ID"""
        loan_data = await self.loan_broker.SelectLoanById(loan_id)
        return LoanResponse(**loan_data) if loan_data else None

    async def get_loans_by_user(
        self, user_id: UUID, status: Optional[str] = None
    ) -> List[LoanResponse]:
        """Get all loans for a user, optionally filtered by status"""
        loans = await self.loan_broker.SelectLoansByUser(user_id, status)
        return [LoanResponse(**loan) for loan in loans]

    async def get_loans_by_user_with_book_info(
        self, user_id: UUID, status: Optional[str] = None
    ) -> List[LoanWithBookInfo]:
        """Get all loans for a user with book details"""
        loans = await self.loan_broker.SelectLoansByUserWithBookInfo(user_id, status)
        now = datetime.now(timezone.utc)

        result = []
        for loan in loans:
            # Calculate is_overdue
            is_overdue = False
            if loan.get("due_date") and loan.get("status") == "active":
                due_date = datetime.fromisoformat(
                    loan["due_date"].replace("Z", "+00:00")
                )
                is_overdue = now > due_date

            loan["is_overdue"] = is_overdue
            result.append(LoanWithBookInfo(**loan))

        return result

    async def get_loans_by_status(
        self, status: LoanStatus, skip: int = 0, limit: int = 100
    ) -> List[LoanResponse]:
        """Get all loans with a specific status"""
        loans = await self.loan_broker.SelectLoansByStatus(status.value, skip, limit)
        return [LoanResponse(**loan) for loan in loans]

    async def get_loans_by_status_with_book_info(
        self, status: LoanStatus, skip: int = 0, limit: int = 100
    ) -> List[LoanWithBookInfo]:
        """Get all loans with a specific status with book details"""
        loans = await self.loan_broker.SelectLoansByStatusWithBookInfo(
            status.value, skip, limit
        )
        now = datetime.now(timezone.utc)

        result = []
        for loan in loans:
            # Calculate is_overdue
            is_overdue = False
            if loan.get("due_date") and loan.get("status") == "active":
                due_date = datetime.fromisoformat(
                    loan["due_date"].replace("Z", "+00:00")
                )
                is_overdue = now > due_date

            loan["is_overdue"] = is_overdue
            result.append(LoanWithBookInfo(**loan))

        return result

    async def get_overdue_loans(self) -> List[LoanResponse]:
        """Get all loans that are overdue"""
        loans = await self.loan_broker.SelectOverdueLoans()
        return [LoanResponse(**loan) for loan in loans]

    # ==================== LOAN POLICIES ====================

    async def get_all_loan_policies(self) -> List[LoanPolicyResponse]:
        """Get all loan policies"""
        policies = await self.loan_broker.SelectAllLoanPolicies()
        return [LoanPolicyResponse(**policy) for policy in policies]

    async def get_loan_policy(self, role: str) -> Optional[LoanPolicyResponse]:
        """Get loan policy for a specific role"""
        policy_data = await self.loan_broker.SelectLoanPolicy(role)
        return LoanPolicyResponse(**policy_data) if policy_data else None

    async def update_loan_policy(
        self, role: str, policy_update: LoanPolicyUpdate
    ) -> Optional[LoanPolicyResponse]:
        """Update loan policy for a specific role"""
        # Check if policy exists
        existing_policy = await self.loan_broker.SelectLoanPolicy(role)
        if not existing_policy:
            raise ValueError(f"Loan policy for role '{role}' not found")

        # Update only provided fields
        update_data = policy_update.model_dump(exclude_unset=True)
        if not update_data:
            raise ValueError("No fields to update")

        updated_policy = await self.loan_broker.UpdateLoanPolicy(role, update_data)
        return LoanPolicyResponse(**updated_policy) if updated_policy else None

    # ==================== LOAN CREATION ====================

    async def create_loan_request(self, user_id: UUID, copy_id: UUID) -> LoanResponse:
        """
        Create a new loan request with full validation

        Checks:
        1. User is not blacklisted
        2. User hasn't exceeded max_books limit
        3. Copy is available
        4. User doesn't already have this copy on loan
        """
        # 1. Get user and check blacklist
        user = await self.user_broker.SelectUserById(user_id)
        if not user:
            raise ValueError("User not found")

        if user.get("is_blacklisted", False):
            raise ValueError(
                f"User is blacklisted. Reason: {user.get('blacklist_note', 'No reason provided')}"
            )

        # 2. Check max_books limit
        policy = await self.loan_broker.SelectLoanPolicy(user["role"])
        if not policy:
            raise ValueError(f"No loan policy found for role {user['role']}")

        active_loans = await self.loan_broker.SelectActiveLoansByUser(user_id)
        if len(active_loans) >= policy["max_books"]:
            raise ValueError(
                f"User has reached maximum book limit ({policy['max_books']} books). "
                f"Currently has {len(active_loans)} active loans."
            )

        # 3. Check if copy is available
        copy = await self.copy_broker.SelectCopyById(copy_id)
        if not copy:
            raise ValueError("Book copy not found")

        if copy["status"] != "available":
            raise ValueError(
                f"Book copy is not available. Current status: {copy['status']}"
            )

        # 4. Check if user already has this copy on loan
        has_on_loan = await self.loan_broker.CheckUserHasCopyOnLoan(user_id, copy_id)
        if has_on_loan:
            raise ValueError("User already has this book copy on loan")

        due_date = await self.calculate_due_date(user_id, copy_id)
        # Create loan request
        loan_data = {
            "user_id": str(user_id),
            "copy_id": str(copy_id),
            "status": "pending",
            "due_date": due_date.isoformat(),
        }

        created_loan = await self.loan_broker.InsertLoan(loan_data)

        # Update copy status to reserved (optional - depends on your workflow)
        # For now, keeping it available until admin approves

        return LoanResponse(**created_loan)

    # ==================== DUE DATE CALCULATION ====================

    async def calculate_due_date(self, user_id: UUID, copy_id: UUID) -> datetime:
        """Calculate due date for a loan with course override logic"""
        user = await self.user_broker.SelectUserById(user_id)
        copy = await self.copy_broker.SelectCopyById(copy_id)

        if not user or not copy:
            raise ValueError("User or copy not found")

        book_id = copy["book_id"]
        course_books = await self.course_broker.SelectCoursesByBook(UUID(book_id))

        if course_books and user["role"] == "student":
            student_enrollments = await self.course_broker.SelectEnrollmentsByStudent(
                user_id
            )
            enrolled_course_codes = {e["course_code"] for e in student_enrollments}

            for course_book in course_books:
                if course_book["course_code"] in enrolled_course_codes:
                    course = await self.course_broker.SelectCourseByCode(
                        course_book["course_code"]
                    )
                    if course:
                        loan_days = course.get("course_loan_days", 90)
                        return datetime.now(timezone.utc) + timedelta(days=loan_days)

        policy = await self.loan_broker.SelectLoanPolicy(user["role"])
        if not policy:
            loan_days = 7
        else:
            loan_days = policy["loan_days"]

        return datetime.now(timezone.utc) + timedelta(days=loan_days)

    async def get_due_date_calculation(self, user_id: UUID, copy_id: UUID) -> dict:
        """Get detailed due date calculation information"""
        user = await self.user_broker.SelectUserById(user_id)
        copy = await self.copy_broker.SelectCopyById(copy_id)

        if not user or not copy:
            raise ValueError("User or copy not found")

        book_id = copy["book_id"]
        calculation_method = "role_policy"
        loan_days = 7

        # Check course override
        course_books = await self.course_broker.SelectCoursesByBook(UUID(book_id))

        if course_books and user["role"] == "student":
            student_enrollments = await self.course_broker.SelectEnrollmentsByStudent(
                user_id
            )
            enrolled_course_codes = {e["course_code"] for e in student_enrollments}

            for course_book in course_books:
                if course_book["course_code"] in enrolled_course_codes:
                    course = await self.course_broker.SelectCourseByCode(
                        course_book["course_code"]
                    )
                    if course:
                        loan_days = course.get("course_loan_days", 90)
                        calculation_method = "course_override"
                        break

        # Use role policy if no course override
        if calculation_method == "role_policy":
            policy = await self.loan_broker.SelectLoanPolicy(user["role"])
            if policy:
                loan_days = policy["loan_days"]

        due_date = datetime.now(timezone.utc) + timedelta(days=loan_days)

        return {
            "copy_id": copy_id,
            "user_id": user_id,
            "due_date": due_date,
            "loan_days": loan_days,
            "calculation_method": calculation_method,
            "role": user["role"],
        }

    # ==================== LOAN APPROVAL ====================

    async def approve_loan(self, loan_id: UUID) -> LoanResponse:
        """
        Approve a loan request

        Actions:
        1. Calculate due date
        2. Update loan status to 'pending_pickup' (waiting for patron to pick up)
        3. Set approval_date and due_date
        """
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")

        if loan["status"] != "pending":
            raise ValueError(f"Loan is not pending. Current status: {loan['status']}")

        # Calculate due date
        due_date = await self.calculate_due_date(
            UUID(loan["user_id"]), UUID(loan["copy_id"])
        )

        # Update loan to pending_pickup status (approved, waiting for pickup)
        update_data = {
            "status": "pending_pickup",
            "approval_date": datetime.now(timezone.utc).isoformat(),
            "due_date": due_date.isoformat(),
        }

        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)
        # Set book copy status back to available
        copy_id = UUID(loan["copy_id"])
        await self.copy_broker.UpdateCopyStatus(copy_id, "available")
        # Update book copy status to maintenance (reserved for pickup)
        copy_id = UUID(loan["copy_id"])
        await self.copy_broker.UpdateCopyStatus(copy_id, "maintenance")

        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== LOAN CHECKOUT (PICKUP) ====================

    async def checkout_loan(self, loan_id: UUID) -> LoanResponse:
        """
        Mark a loan as checked out (patron picked up the book)

        Actions:
        - Verify loan is in pending_pickup status
        - Update status to 'active' (with patron)
        """
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")

        if loan["status"] != "pending_pickup":
            raise ValueError(
                f"Loan is not pending pickup. Current status: {loan['status']}"
            )

        # Update loan to active (patron has the book)
        update_data = {"status": "active"}

        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)

        # Keep book copy status as maintenance (checked out to patron)
        # Note: Copy remains unavailable until returned

        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== LOAN REJECTION ====================

    async def reject_loan(self, loan_id: UUID) -> LoanResponse:
        """Reject a loan request (Admin only)"""
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")

        if loan["status"] != "pending":
            raise ValueError(f"Loan is not pending. Current status: {loan['status']}")

        update_data = {"status": "rejected"}

        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)

        # Book copy should remain available since loan was never approved

        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== LOAN CANCELLATION ====================

    async def cancel_loan(
        self, loan_id: UUID, user_id: Optional[UUID] = None
    ) -> LoanResponse:
        """
        Cancel a loan request (User can cancel their own pending or pending_pickup loans)

        Actions:
        - Verify loan belongs to the user (if user_id provided)
        - Only allow canceling 'pending' or 'pending_pickup' loans
        - Update status to 'canceled'
        """
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")

        # Verify ownership if user_id is provided
        if user_id and str(loan["user_id"]) != str(user_id):
            raise ValueError("You can only cancel your own loan requests")

        if loan["status"] not in ["pending", "pending_pickup"]:
            raise ValueError(
                f"Only pending or pending_pickup loans can be canceled. Current status: {loan['status']}"
            )

        update_data = {"status": "canceled"}

        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)

        # If loan was pending_pickup, set book copy back to available
        if loan["status"] == "pending_pickup":
            copy_id = UUID(loan["copy_id"])
            await self.copy_broker.UpdateCopyStatus(copy_id, "available")

        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== LOAN RETURN ====================

    async def return_loan(
        self, loan_id: UUID, increment_infractions: bool = False
    ) -> LoanResponse:
        """
        Process a book return

        Actions:
        1. Update loan status to 'returned'
        2. Set return_date
        3. If overdue and increment_infractions=True, increment user's infractions_count
        4. Update copy status back to 'available'
        """
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")

        if loan["status"] not in ["active", "overdue"]:
            raise ValueError(
                f"Loan cannot be returned. Current status: {loan['status']}"
            )

        now = datetime.now(timezone.utc)

        # Check if overdue
        is_overdue = False
        if loan.get("due_date"):
            due_date = datetime.fromisoformat(loan["due_date"].replace("Z", "+00:00"))
            is_overdue = now > due_date

        # Update loan
        update_data = {"status": "returned", "return_date": now.isoformat()}

        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)

        # Update copy status back to available
        await self.copy_broker.UpdateCopy(
            UUID(loan["copy_id"]), {"status": "available"}
        )

        # Increment infractions if overdue and requested
        if is_overdue and increment_infractions:
            user = await self.user_broker.SelectUserById(UUID(loan["user_id"]))
            if user:
                current_infractions = user.get("infractions_count", 0)
                await self.user_broker.UpdateUser(
                    UUID(loan["user_id"]),
                    {"infractions_count": current_infractions + 1},
                )

        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== OVERDUE DETECTION ====================

    async def mark_overdue_loans(self) -> List[LoanResponse]:
        """
        Mark all active loans past their due date as overdue

        This should be run periodically (e.g., daily cron job)
        """
        overdue_loans = await self.loan_broker.select_overdue_loans()
        updated_loans = []

        for loan in overdue_loans:
            update_data = {"status": "overdue"}
            updated_loan = await self.loan_broker.update_loan(
                UUID(loan["id"]), update_data
            )
            if updated_loan:
                updated_loans.append(LoanResponse(**updated_loan))

        return updated_loans

    # ==================== GENERAL UPDATE ====================

    async def update_loan(
        self, loan_id: UUID, loan_update: LoanUpdate
    ) -> Optional[LoanResponse]:
        """General loan update (for admin adjustments)"""
        existing_loan = await self.loan_broker.SelectLoanById(loan_id)
        if not existing_loan:
            return None

        update_data = loan_update.model_dump(exclude_unset=True)

        # Convert datetime objects to ISO strings
        for key in ["approval_date", "due_date", "return_date"]:
            if key in update_data and update_data[key]:
                if isinstance(update_data[key], datetime):
                    update_data[key] = update_data[key].isoformat()

        if "status" in update_data and update_data["status"]:
            update_data["status"] = (
                update_data["status"].value
                if hasattr(update_data["status"], "value")
                else update_data["status"]
            )

        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)
        return LoanResponse(**updated_loan) if updated_loan else None

    async def delete_loan(self, loan_id: UUID) -> bool:
        """Delete a loan (admin only, use with caution)"""
        return await self.loan_broker.DeleteLoan(loan_id)

    async def search_loans(
        self,
        user_id: Optional[UUID] = None,
        status: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[LoanResponse]:
        """Search loans with multiple filters"""
        loans = await self.loan_broker.SearchLoans(user_id, status, from_date, to_date)
        return [LoanResponse(**loan) for loan in loans]
