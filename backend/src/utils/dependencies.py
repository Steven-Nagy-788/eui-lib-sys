from fastapi import Depends
from supabase import Client

from ..Brokers.bookBroker import BookBroker
from ..Brokers.bookCopyBroker import BookCopyBroker
from ..Brokers.courseBroker import CourseBroker
from ..Brokers.loanBroker import LoanBroker
from ..Brokers.statsBroker import StatsBroker
from ..Brokers.userBroker import UserBroker
from ..Services.bookCopyService import BookCopyService
from ..Services.bookService import BookService
from ..Services.courseService import CourseService
from ..Services.loanService import LoanService
from ..Services.statsService import StatsService
from ..Services.userService import UserService
from .config import get_supabase


# 1. Inject the Singleton Client
def get_db_client() -> Client:
    return get_supabase()


# 2. Inject the Broker (initialized with the client)
def get_user_broker(client: Client = Depends(get_db_client)) -> UserBroker:
    return UserBroker(client)


def get_book_broker(client: Client = Depends(get_db_client)) -> BookBroker:
    return BookBroker(client)


def get_book_copy_broker(client: Client = Depends(get_db_client)) -> BookCopyBroker:
    return BookCopyBroker(client)


def get_course_broker(client: Client = Depends(get_db_client)) -> CourseBroker:
    return CourseBroker(client)


def get_loan_broker(client: Client = Depends(get_db_client)) -> LoanBroker:
    return LoanBroker(client)


def get_stats_broker(client: Client = Depends(get_db_client)) -> StatsBroker:
    return StatsBroker(client)


# 3. Inject the Service (initialized with the broker)
def get_user_service(broker: UserBroker = Depends(get_user_broker)) -> UserService:
    return UserService(broker)


def get_book_service(broker: BookBroker = Depends(get_book_broker)) -> BookService:
    return BookService(broker)


def get_book_copy_service(
    broker: BookCopyBroker = Depends(get_book_copy_broker),
) -> BookCopyService:
    return BookCopyService(broker)


def get_course_service(
    broker: CourseBroker = Depends(get_course_broker),
) -> CourseService:
    return CourseService(broker)


def get_loan_service(
    loan_broker: LoanBroker = Depends(get_loan_broker),
    user_broker: UserBroker = Depends(get_user_broker),
    copy_broker: BookCopyBroker = Depends(get_book_copy_broker),
    course_broker: CourseBroker = Depends(get_course_broker),
) -> LoanService:
    return LoanService(loan_broker, user_broker, copy_broker, course_broker)


def get_stats_service(broker: StatsBroker = Depends(get_stats_broker)) -> StatsService:
    return StatsService(broker)
