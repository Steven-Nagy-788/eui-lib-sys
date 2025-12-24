"""
Abstract Base Classes for Service Layer
Defines interfaces for all service classes to enable dependency injection and testing
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from ..Models.Books import (
    BookCreate,
    BookResponse,
    BookWithStatsResponse,
    BookWithStatsAndCoursesResponse,
)
from ..Models.Users import UserCreate, UserResponse, UserUpdate
from ..Models.Loans import LoanCreate, LoanResponse, LoanWithBookInfo
from ..Models.Courses import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    EnrollmentCreate,
)


class IBookService(ABC):
    """Abstract interface for Book business logic"""

    @abstractmethod
    async def RetrieveAllBooks(
        self, skip: int = 0, limit: int = 10
    ) -> List[BookResponse]:
        """Get all books with pagination"""
        pass

    @abstractmethod
    async def RetrieveBookById(self, book_id: UUID) -> Optional[BookResponse]:
        """Get a book by ID"""
        pass

    @abstractmethod
    async def AddBook(self, book: BookCreate) -> BookResponse:
        """Create a new book"""
        pass

    @abstractmethod
    async def ModifyBook(
        self, book_id: UUID, book: BookCreate
    ) -> Optional[BookResponse]:
        """Update a book"""
        pass

    @abstractmethod
    async def RemoveBook(self, book_id: UUID) -> bool:
        """Delete a book"""
        pass

    @abstractmethod
    async def SearchBooks(self, query: str) -> List[BookResponse]:
        """Search books by title, author, or ISBN"""
        pass

    @abstractmethod
    async def RetrieveBooksWithStats(
        self, skip: int = 0, limit: int = 50
    ) -> List[BookWithStatsResponse]:
        """Get books with copy statistics"""
        pass

    @abstractmethod
    async def RetrieveBooksWithStatsAndCourses(
        self, skip: int = 0, limit: int = 100
    ) -> List[BookWithStatsAndCoursesResponse]:
        """Get books with copy statistics and associated courses"""
        pass


class IUserService(ABC):
    """Abstract interface for User business logic"""

    @abstractmethod
    async def RetrieveAllUsers(
        self, skip: int = 0, limit: int = 50
    ) -> List[UserResponse]:
        """Get all users with pagination"""
        pass

    @abstractmethod
    async def RetrieveUserById(self, user_id: UUID) -> Optional[UserResponse]:
        """Get a user by ID"""
        pass

    @abstractmethod
    async def AddUser(self, user: UserCreate) -> UserResponse:
        """Create a new user"""
        pass

    @abstractmethod
    async def ModifyUser(
        self, user_id: UUID, user: UserUpdate, current_user_id: UUID, is_admin: bool
    ) -> Optional[UserResponse]:
        """Update a user"""
        pass

    @abstractmethod
    async def RemoveUser(self, user_id: UUID) -> bool:
        """Delete a user"""
        pass

    @abstractmethod
    async def SearchUsers(self, query: str) -> List[UserResponse]:
        """Search users by name, email, or university ID"""
        pass

    @abstractmethod
    async def AddToBlacklist(
        self, user_id: UUID, reason: str
    ) -> Optional[UserResponse]:
        """Add a user to the blacklist"""
        pass

    @abstractmethod
    async def RemoveFromBlacklist(self, user_id: UUID) -> Optional[UserResponse]:
        """Remove a user from the blacklist"""
        pass

    @abstractmethod
    async def ResetInfractions(self, user_id: UUID) -> Optional[UserResponse]:
        """Reset user's infraction count"""
        pass


class ILoanService(ABC):
    """Abstract interface for Loan business logic"""

    @abstractmethod
    async def RetrieveAllLoans(
        self, skip: int = 0, limit: int = 50
    ) -> List[LoanResponse]:
        """Get all loans with pagination"""
        pass

    @abstractmethod
    async def RetrieveLoanById(self, loan_id: UUID) -> Optional[LoanResponse]:
        """Get a loan by ID"""
        pass

    @abstractmethod
    async def RetrieveLoansByUserId(self, user_id: UUID) -> List[LoanResponse]:
        """Get all loans for a user"""
        pass

    @abstractmethod
    async def RetrieveLoansByStatus(
        self, status: str, skip: int = 0, limit: int = 50
    ) -> List[LoanWithBookInfo]:
        """Get loans by status with book information"""
        pass

    @abstractmethod
    async def CreateLoanRequest(self, loan: LoanCreate, user_id: UUID) -> LoanResponse:
        """Create a new loan request"""
        pass

    @abstractmethod
    async def ApproveLoan(self, loan_id: UUID) -> Optional[LoanResponse]:
        """Approve a loan request"""
        pass

    @abstractmethod
    async def RejectLoan(self, loan_id: UUID, reason: str) -> Optional[LoanResponse]:
        """Reject a loan request"""
        pass

    @abstractmethod
    async def CheckoutLoan(self, loan_id: UUID) -> Optional[LoanResponse]:
        """Checkout a loan (patron pickup)"""
        pass

    @abstractmethod
    async def ReturnLoan(self, loan_id: UUID) -> Optional[LoanResponse]:
        """Process a book return"""
        pass

    @abstractmethod
    async def CancelLoan(
        self, loan_id: UUID, user_id: UUID, is_admin: bool
    ) -> Optional[LoanResponse]:
        """Cancel a loan request"""
        pass

    @abstractmethod
    async def CalculateDueDate(self, copy_id: UUID, user_id: UUID) -> dict:
        """Calculate due date for a potential loan"""
        pass


class ICourseService(ABC):
    """Abstract interface for Course business logic"""

    @abstractmethod
    async def RetrieveAllCourses(
        self, skip: int = 0, limit: int = 50
    ) -> List[CourseResponse]:
        """Get all courses with pagination"""
        pass

    @abstractmethod
    async def RetrieveCourseById(self, course_id: UUID) -> Optional[CourseResponse]:
        """Get a course by ID"""
        pass

    @abstractmethod
    async def AddCourse(self, course: CourseCreate) -> CourseResponse:
        """Create a new course"""
        pass

    @abstractmethod
    async def ModifyCourse(
        self, course_id: UUID, course: CourseUpdate
    ) -> Optional[CourseResponse]:
        """Update a course"""
        pass

    @abstractmethod
    async def RemoveCourse(self, course_id: UUID) -> bool:
        """Delete a course"""
        pass

    @abstractmethod
    async def EnrollStudent(
        self, course_id: UUID, enrollment: EnrollmentCreate
    ) -> dict:
        """Enroll a student in a course"""
        pass

    @abstractmethod
    async def UnenrollStudent(self, course_id: UUID, user_id: UUID) -> bool:
        """Remove a student from a course"""
        pass
