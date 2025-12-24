"""
Abstract Base Classes for Broker Layer
Defines interfaces for all broker classes to enable dependency injection and testing
"""
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID


class IBookBroker(ABC):
    """Abstract interface for Book database operations"""
    
    @abstractmethod
    async def SelectAllBooks(self, skip: int = 0, limit: int = 10) -> list[dict]:
        """Retrieve all books with pagination"""
        pass
    
    @abstractmethod
    async def SelectBookById(self, book_id: UUID) -> Optional[dict]:
        """Retrieve a book by ID"""
        pass
    
    @abstractmethod
    async def SelectBookByIsbn(self, isbn: str) -> Optional[dict]:
        """Retrieve a book by ISBN"""
        pass
    
    @abstractmethod
    async def InsertBook(self, book_data: dict) -> dict:
        """Insert a new book"""
        pass
    
    @abstractmethod
    async def UpdateBook(self, book_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book by ID"""
        pass
    
    @abstractmethod
    async def DeleteBook(self, book_id: UUID) -> bool:
        """Delete a book by ID"""
        pass
    
    @abstractmethod
    async def SearchBooks(self, query: str) -> list[dict]:
        """Search books by title, author, or ISBN"""
        pass
    
    @abstractmethod
    async def SelectAllBooksWithStats(self, skip: int = 0, limit: int = 50) -> list[dict]:
        """Get all books with copy statistics"""
        pass
    
    @abstractmethod
    async def SelectAllBooksWithStatsAndCourses(self, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get all books with copy statistics and associated courses"""
        pass


class IBookCopyBroker(ABC):
    """Abstract interface for BookCopy database operations"""
    
    @abstractmethod
    async def SelectAllCopiesByBookId(self, book_id: UUID) -> list[dict]:
        """Get all copies of a specific book"""
        pass
    
    @abstractmethod
    async def SelectCopyById(self, copy_id: UUID) -> Optional[dict]:
        """Get a specific copy by ID"""
        pass
    
    @abstractmethod
    async def InsertCopy(self, copy_data: dict) -> dict:
        """Insert a new book copy"""
        pass
    
    @abstractmethod
    async def InsertBulkCopies(self, copies_data: list[dict]) -> list[dict]:
        """Insert multiple book copies"""
        pass
    
    @abstractmethod
    async def UpdateCopy(self, copy_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a book copy"""
        pass
    
    @abstractmethod
    async def DeleteCopy(self, copy_id: UUID) -> bool:
        """Delete a book copy"""
        pass
    
    @abstractmethod
    async def CountCopiesByBookId(self, book_id: UUID) -> dict:
        """Count total, available, and reference copies for a book"""
        pass
    
    @abstractmethod
    async def UpdateCopyStatus(self, copy_id: UUID, status: str) -> Optional[dict]:
        """Update the status of a book copy"""
        pass


class IUserBroker(ABC):
    """Abstract interface for User database operations"""
    
    @abstractmethod
    async def SelectAllUsers(self, skip: int = 0, limit: int = 50) -> list[dict]:
        """Get all users with pagination"""
        pass
    
    @abstractmethod
    async def SelectUserById(self, user_id: UUID) -> Optional[dict]:
        """Get a user by ID"""
        pass
    
    @abstractmethod
    async def SelectUserByEmail(self, email: str) -> Optional[dict]:
        """Get a user by email"""
        pass
    
    @abstractmethod
    async def SelectUserByUniversityId(self, university_id: str) -> Optional[dict]:
        """Get a user by university ID"""
        pass
    
    @abstractmethod
    async def InsertUser(self, user_data: dict) -> dict:
        """Create a new user"""
        pass
    
    @abstractmethod
    async def UpdateUser(self, user_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a user"""
        pass
    
    @abstractmethod
    async def DeleteUser(self, user_id: UUID) -> bool:
        """Delete a user"""
        pass
    
    @abstractmethod
    async def SearchUsers(self, query: str) -> list[dict]:
        """Search users by name, email, or university ID"""
        pass
    
    @abstractmethod
    async def AddUserToBlacklist(self, user_id: UUID, reason: str) -> dict:
        """Add a user to the blacklist"""
        pass
    
    @abstractmethod
    async def RemoveUserFromBlacklist(self, user_id: UUID) -> bool:
        """Remove a user from the blacklist"""
        pass
    
    @abstractmethod
    async def ResetUserInfractions(self, user_id: UUID) -> Optional[dict]:
        """Reset user's infraction count to 0"""
        pass


class ILoanBroker(ABC):
    """Abstract interface for Loan database operations"""
    
    @abstractmethod
    async def SelectAllLoans(self, skip: int = 0, limit: int = 50) -> list[dict]:
        """Get all loans with pagination"""
        pass
    
    @abstractmethod
    async def SelectLoanById(self, loan_id: UUID) -> Optional[dict]:
        """Get a loan by ID"""
        pass
    
    @abstractmethod
    async def SelectLoansByUserId(self, user_id: UUID) -> list[dict]:
        """Get all loans for a user"""
        pass
    
    @abstractmethod
    async def SelectActiveLoansByUser(self, user_id: UUID) -> list[dict]:
        """Get active loans for a user"""
        pass
    
    @abstractmethod
    async def SelectLoansByStatus(self, status: str, skip: int = 0, limit: int = 50) -> list[dict]:
        """Get loans by status"""
        pass
    
    @abstractmethod
    async def InsertLoan(self, loan_data: dict) -> dict:
        """Create a new loan request"""
        pass
    
    @abstractmethod
    async def UpdateLoan(self, loan_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a loan"""
        pass
    
    @abstractmethod
    async def DeleteLoan(self, loan_id: UUID) -> bool:
        """Delete a loan"""
        pass
    
    @abstractmethod
    async def CheckUserHasCopyOnLoan(self, user_id: UUID, copy_id: UUID) -> bool:
        """Check if user already has this copy on loan"""
        pass
    
    @abstractmethod
    async def CountActiveLoansByUser(self, user_id: UUID) -> int:
        """Count active loans for a user"""
        pass


class ICourseBroker(ABC):
    """Abstract interface for Course database operations"""
    
    @abstractmethod
    async def SelectAllCourses(self, skip: int = 0, limit: int = 50) -> list[dict]:
        """Get all courses with pagination"""
        pass
    
    @abstractmethod
    async def SelectCourseById(self, course_id: UUID) -> Optional[dict]:
        """Get a course by ID"""
        pass
    
    @abstractmethod
    async def SelectCourseByCode(self, course_code: str) -> Optional[dict]:
        """Get a course by course code"""
        pass
    
    @abstractmethod
    async def InsertCourse(self, course_data: dict) -> dict:
        """Create a new course"""
        pass
    
    @abstractmethod
    async def UpdateCourse(self, course_id: UUID, update_data: dict) -> Optional[dict]:
        """Update a course"""
        pass
    
    @abstractmethod
    async def DeleteCourse(self, course_id: UUID) -> bool:
        """Delete a course"""
        pass
    
    @abstractmethod
    async def EnrollStudent(self, course_id: UUID, user_id: UUID) -> dict:
        """Enroll a student in a course"""
        pass
    
    @abstractmethod
    async def UnenrollStudent(self, course_id: UUID, user_id: UUID) -> bool:
        """Remove a student from a course"""
        pass
    
    @abstractmethod
    async def GetCoursesByUserId(self, user_id: UUID) -> list[dict]:
        """Get all courses a user is enrolled in"""
        pass


class IStatsBroker(ABC):
    """Abstract interface for Statistics database operations"""
    
    @abstractmethod
    async def GetDashboardStats(self) -> dict:
        """Get dashboard overview statistics"""
        pass
    
    @abstractmethod
    async def GetBookStats(self) -> dict:
        """Get book-related statistics"""
        pass
    
    @abstractmethod
    async def GetLoanStats(self) -> dict:
        """Get loan-related statistics"""
        pass
    
    @abstractmethod
    async def GetUserStats(self) -> dict:
        """Get user-related statistics"""
        pass
