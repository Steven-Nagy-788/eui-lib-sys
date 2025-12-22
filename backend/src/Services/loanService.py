from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from ..Models.Loans import (
    LoanCreate,
    LoanResponse,
    LoanUpdate,
    LoanStatus,
    LoanPolicyResponse
)
from ..Brokers.loanBroker import LoanBroker
from ..Brokers.userBroker import UserBroker
from ..Brokers.bookCopyBroker import BookCopyBroker
from ..Brokers.courseBroker import CourseBroker


class LoanService:
    def __init__(
        self, 
        loan_broker: LoanBroker,
        user_broker: UserBroker,
        copy_broker: BookCopyBroker,
        course_broker: CourseBroker
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
    
    async def get_loans_by_user(self, user_id: UUID, status: Optional[str] = None) -> List[LoanResponse]:
        """Get all loans for a user, optionally filtered by status"""
        loans = await self.loan_broker.SelectLoansByUser(user_id, status)
        return [LoanResponse(**loan) for loan in loans]
    
    async def get_loans_by_status(self, status: LoanStatus, skip: int = 0, limit: int = 100) -> List[LoanResponse]:
        """Get all loans with a specific status"""
        loans = await self.loan_broker.SelectLoansByStatus(status.value, skip, limit)
        return [LoanResponse(**loan) for loan in loans]
    
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
            raise ValueError(f"User is blacklisted. Reason: {user.get('blacklist_note', 'No reason provided')}")
        
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
            raise ValueError(f"Book copy is not available. Current status: {copy['status']}")
        
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
            "due_date": due_date.isoformat()
        }
        
        created_loan = await self.loan_broker.InsertLoan(loan_data)
        
        # Update copy status to reserved (optional - depends on your workflow)
        # For now, keeping it available until admin approves
        
        return LoanResponse(**created_loan)

    # ==================== DUE DATE CALCULATION ====================
    
    async def calculate_due_date(self, user_id: UUID, copy_id: UUID) -> datetime:
        """
        Calculate due date for a loan with course override logic
        
        Priority:
        1. If student is enrolled in a course that requires this book → use course_loan_days
        2. Otherwise → use loan_policies based on user role
        """
        # Get user and book info
        user = await self.user_broker.SelectUserById(user_id)
        copy = await self.copy_broker.SelectCopyById(copy_id)
        
        if not user or not copy:
            raise ValueError("User or copy not found")
        
        book_id = copy["book_id"]
        
        # Check if this book is required for any courses
        course_books = await self.course_broker.SelectCoursesByBook(UUID(book_id))
        
        if course_books and user["role"] == "student":
            # Check if student is enrolled in any of these courses
            student_enrollments = await self.course_broker.SelectEnrollmentsByStudent(user_id)
            enrolled_course_codes = {e["course_code"] for e in student_enrollments}
            
            for course_book in course_books:
                if course_book["course_code"] in enrolled_course_codes:
                    # Student is enrolled in a course that requires this book
                    course = await self.course_broker.SelectCourseByCode(course_book["course_code"])
                    if course:
                        loan_days = course.get("course_loan_days", 90)
                        return datetime.utcnow() + timedelta(days=loan_days)
        
        # Default: use loan policy based on role
        policy = await self.loan_broker.SelectLoanPolicy(user["role"])
        if not policy:
            # Fallback to default
            loan_days = 7
        else:
            loan_days = policy["loan_days"]
        
        return datetime.utcnow() + timedelta(days=loan_days)

    # ==================== LOAN APPROVAL ====================
    
    async def approve_loan(self, loan_id: UUID) -> LoanResponse:
        """
        Approve a loan request
        
        Actions:
        1. Calculate due date
        2. Update loan status to 'active'
        3. Set approval_date and due_date
        4. Update copy status (optional)
        """
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")
        
        if loan["status"] != "pending":
            raise ValueError(f"Loan is not pending. Current status: {loan['status']}")
        
        # Calculate due date
        due_date = await self.calculate_due_date(UUID(loan["user_id"]), UUID(loan["copy_id"]))
        
        # Update loan
        update_data = {
            "status": "active",
            "approval_date": datetime.utcnow().isoformat(),
            "due_date": due_date.isoformat()
        }
        
        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)
        
        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== LOAN REJECTION ====================
    
    async def reject_loan(self, loan_id: UUID) -> LoanResponse:
        """Reject a loan request"""
        loan = await self.loan_broker.SelectLoanById(loan_id)
        if not loan:
            raise ValueError("Loan not found")
        
        if loan["status"] != "pending":
            raise ValueError(f"Loan is not pending. Current status: {loan['status']}")
        
        update_data = {
            "status": "rejected"
        }
        
        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)
        return LoanResponse(**updated_loan) if updated_loan else None

    # ==================== LOAN RETURN ====================
    
    async def return_loan(self, loan_id: UUID, increment_infractions: bool = False) -> LoanResponse:
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
            raise ValueError(f"Loan cannot be returned. Current status: {loan['status']}")
        
        now = datetime.utcnow()
        
        # Check if overdue
        is_overdue = False
        if loan.get("due_date"):
            due_date = datetime.fromisoformat(loan["due_date"].replace("Z", "+00:00"))
            is_overdue = now > due_date
        
        # Update loan
        update_data = {
            "status": "returned",
            "return_date": now.isoformat()
        }
        
        updated_loan = await self.loan_broker.UpdateLoan(loan_id, update_data)
        
        # Update copy status back to available
        await self.copy_broker.UpdateCopy(UUID(loan["copy_id"]), {"status": "available"})
        
        # Increment infractions if overdue and requested
        if is_overdue and increment_infractions:
            user = await self.user_broker.SelectUserById(UUID(loan["user_id"]))
            if user:
                current_infractions = user.get("infractions_count", 0)
                await self.user_broker.UpdateUser(
                    UUID(loan["user_id"]),
                    {"infractions_count": current_infractions + 1}
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
            updated_loan = await self.loan_broker.update_loan(UUID(loan["id"]), update_data)
            if updated_loan:
                updated_loans.append(LoanResponse(**updated_loan))
        
        return updated_loans

    # ==================== GENERAL UPDATE ====================
    
    async def update_loan(self, loan_id: UUID, loan_update: LoanUpdate) -> Optional[LoanResponse]:
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
            update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
        
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
        to_date: Optional[str] = None
    ) -> List[LoanResponse]:
        """Search loans with multiple filters"""
        loans = await self.loan_broker.SearchLoans(user_id, status, from_date, to_date)
        return [LoanResponse(**loan) for loan in loans]
