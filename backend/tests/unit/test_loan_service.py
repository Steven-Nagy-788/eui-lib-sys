"""
Unit tests for LoanService
Tests business logic with mocked dependencies
"""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.Models.Loans import LoanResponse, LoanStatus
from src.Services.loanService import LoanService


class TestLoanService:
    """Test suite for LoanService business logic"""

    @pytest.fixture
    def mock_loan_broker(self):
        """Create mocked LoanBroker"""
        return AsyncMock()

    @pytest.fixture
    def mock_user_broker(self):
        """Create mocked UserBroker"""
        return AsyncMock()

    @pytest.fixture
    def mock_copy_broker(self):
        """Create mocked BookCopyBroker"""
        return AsyncMock()

    @pytest.fixture
    def mock_course_broker(self):
        """Create mocked CourseBroker"""
        return AsyncMock()

    @pytest.fixture
    def service(
        self, mock_loan_broker, mock_user_broker, mock_copy_broker, mock_course_broker
    ):
        """Create LoanService instance with mocked brokers"""
        return LoanService(
            mock_loan_broker, mock_user_broker, mock_copy_broker, mock_course_broker
        )

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_all_loans_success(
        self, service, mock_loan_broker, sample_loan_dict
    ):
        """Test successful retrieval of all loans"""
        mock_loan_broker.SelectAllLoans.return_value = [sample_loan_dict]

        result = await service.get_all_loans(skip=0, limit=50)

        assert len(result) == 1
        assert isinstance(result[0], LoanResponse)
        mock_loan_broker.SelectAllLoans.assert_called_once_with(skip=0, limit=50)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_loan_by_id_found(
        self, service, mock_loan_broker, sample_loan_dict
    ):
        """Test successful retrieval of loan by ID"""
        loan_id = uuid4()
        mock_loan_broker.SelectLoanById.return_value = sample_loan_dict

        result = await service.get_loan_by_id(loan_id)

        assert result is not None
        assert isinstance(result, LoanResponse)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_loan_by_id_not_found(self, service, mock_loan_broker):
        """Test retrieval when loan doesn't exist"""
        loan_id = uuid4()
        mock_loan_broker.SelectLoanById.return_value = None

        result = await service.get_loan_by_id(loan_id)

        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_loans_by_user(self, service, mock_loan_broker, sample_loan_dict):
        """Test retrieval of loans by user ID"""
        user_id = uuid4()
        mock_loan_broker.SelectLoansByUser.return_value = [sample_loan_dict]

        result = await service.get_loans_by_user(user_id)

        assert len(result) == 1
        assert isinstance(result[0], LoanResponse)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_loans_by_status(
        self, service, mock_loan_broker, sample_loan_dict
    ):
        """Test retrieval of loans by status"""
        mock_loan_broker.SelectLoansByStatus.return_value = [sample_loan_dict]

        result = await service.get_loans_by_status(LoanStatus.PENDING, skip=0, limit=50)

        assert len(result) == 1
        mock_loan_broker.SelectLoansByStatus.assert_called_once_with("pending", 0, 50)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_create_loan_request_success(
        self,
        service,
        mock_loan_broker,
        mock_user_broker,
        mock_copy_broker,
        mock_course_broker,
        sample_loan_dict,
    ):
        """Test successful loan request creation"""
        copy_id = uuid4()
        user_id = uuid4()
        book_id = str(uuid4())
        mock_user_broker.SelectUserById.return_value = {
            "id": str(user_id),
            "is_blacklisted": False,
            "role": "student",
        }
        mock_loan_broker.SelectLoanPolicy.return_value = {
            "max_books": 5,
            "loan_duration_days": 14,
            "loan_days": 14,
        }
        mock_copy_broker.SelectCopyById.return_value = {
            "status": "available",
            "is_reference": False,
            "book_id": book_id,
        }
        mock_course_broker.SelectCoursesByBook.return_value = []
        mock_course_broker.SelectEnrollmentsByStudent.return_value = []
        mock_loan_broker.CheckUserHasCopyOnLoan.return_value = False
        mock_loan_broker.SelectActiveLoansByUser.return_value = []
        mock_loan_broker.InsertLoan.return_value = sample_loan_dict

        result = await service.create_loan_request(user_id, copy_id)

        assert isinstance(result, LoanResponse)
        mock_loan_broker.InsertLoan.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_create_loan_request_copy_not_available(
        self, service, mock_loan_broker, mock_user_broker, mock_copy_broker
    ):
        """Test loan request fails when copy is not available"""
        copy_id = uuid4()
        user_id = uuid4()
        mock_user_broker.SelectUserById.return_value = {
            "id": str(user_id),
            "is_blacklisted": False,
            "role": "student",
        }
        mock_loan_broker.SelectLoanPolicy.return_value = {
            "max_books": 5,
            "loan_duration_days": 14,
        }
        mock_copy_broker.SelectCopyById.return_value = {
            "status": "checked_out",
            "is_reference": False,
            "book_id": str(uuid4()),
        }
        mock_loan_broker.SelectActiveLoansByUser.return_value = []

        with pytest.raises(ValueError, match="Book copy is not available"):
            await service.create_loan_request(user_id, copy_id)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_approve_loan_success(
        self,
        service,
        mock_loan_broker,
        mock_user_broker,
        mock_copy_broker,
        mock_course_broker,
        sample_loan_dict,
    ):
        """Test successful loan approval"""
        loan_id = uuid4()
        copy_id = str(uuid4())
        user_id = str(uuid4())
        book_id = str(uuid4())
        pending_loan = {
            **sample_loan_dict,
            "status": "pending",
            "user_id": user_id,
            "copy_id": copy_id,
        }
        approved_loan = {**sample_loan_dict, "status": "pending_pickup"}

        mock_loan_broker.SelectLoanById.return_value = pending_loan
        mock_user_broker.SelectUserById.return_value = {
            "id": user_id,
            "role": "student",
        }
        mock_copy_broker.SelectCopyById.return_value = {"book_id": book_id}
        mock_course_broker.SelectCoursesByBook.return_value = []
        mock_course_broker.SelectEnrollmentsByStudent.return_value = []
        mock_loan_broker.SelectLoanPolicy.return_value = {
            "loan_duration_days": 14,
            "loan_days": 14,
        }
        mock_loan_broker.UpdateLoan.return_value = approved_loan

        result = await service.approve_loan(loan_id)

        assert result is not None
        mock_loan_broker.UpdateLoan.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_checkout_loan_success(
        self, service, mock_loan_broker, mock_copy_broker, sample_loan_dict
    ):
        """Test successful loan checkout"""
        loan_id = uuid4()
        pending_loan = {
            **sample_loan_dict,
            "status": "pending_pickup",
            "copy_id": str(uuid4()),
        }
        active_loan = {**sample_loan_dict, "status": "active"}

        mock_loan_broker.SelectLoanById.return_value = pending_loan
        mock_loan_broker.UpdateLoan.return_value = active_loan

        result = await service.checkout_loan(loan_id)

        assert result is not None
        assert isinstance(result, LoanResponse)
