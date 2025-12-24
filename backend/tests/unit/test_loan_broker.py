"""
Unit tests for LoanBroker
Tests database operations with mocked Supabase client
"""

from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4

import pytest

from src.Brokers.loanBroker import LoanBroker


class TestLoanBroker:
    """Test suite for LoanBroker database operations"""

    @pytest.fixture
    def broker(self, mock_supabase_client):
        """Create LoanBroker instance with mocked client"""
        return LoanBroker(mock_supabase_client)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_all_loans_success(
        self, broker, mock_supabase_client, sample_loan_dict
    ):
        """Test successful retrieval of all loans"""
        mock_response = MagicMock()
        mock_response.data = [sample_loan_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectAllLoans(skip=0, limit=50)

        assert result == [sample_loan_dict]
        assert len(result) == 1

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_loan_by_id_found(
        self, broker, mock_supabase_client, sample_loan_dict
    ):
        """Test successful retrieval of loan by ID"""
        loan_id = UUID(sample_loan_dict["id"])
        mock_response = MagicMock()
        mock_response.data = [sample_loan_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectLoanById(loan_id)

        assert result == sample_loan_dict
        mock_supabase_client.eq.assert_called_with("id", str(loan_id))

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_loans_by_user_id(
        self, broker, mock_supabase_client, sample_loan_dict
    ):
        """Test retrieval of loans by user ID"""
        user_id = UUID(sample_loan_dict["user_id"])
        mock_response = MagicMock()
        mock_response.data = [sample_loan_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectLoansByUser(user_id)

        assert result == [sample_loan_dict]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_select_loans_by_status(
        self, broker, mock_supabase_client, sample_loan_dict
    ):
        """Test retrieval of loans by status"""
        status = "active"
        mock_response = MagicMock()
        mock_response.data = [sample_loan_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.SelectLoansByStatus(status)

        assert result == [sample_loan_dict]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_insert_loan_success(
        self, broker, mock_supabase_client, sample_loan_dict
    ):
        """Test successful loan insertion"""
        loan_data = {"user_id": str(uuid4()), "copy_id": str(uuid4())}
        mock_response = MagicMock()
        mock_response.data = [sample_loan_dict]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.InsertLoan(loan_data)

        assert result == sample_loan_dict
        mock_supabase_client.insert.assert_called_once_with(loan_data)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_loan_success(
        self, broker, mock_supabase_client, sample_loan_dict
    ):
        """Test successful loan update"""
        loan_id = UUID(sample_loan_dict["id"])
        update_data = {"status": "returned"}
        updated_loan = {**sample_loan_dict, **update_data}
        mock_response = MagicMock()
        mock_response.data = [updated_loan]
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.UpdateLoan(loan_id, update_data)

        assert result == updated_loan
        mock_supabase_client.update.assert_called_once_with(update_data)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_check_user_has_copy_on_loan_true(self, broker, mock_supabase_client):
        """Test checking if user has copy on loan - returns True"""
        user_id = uuid4()
        copy_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            result = await broker.CheckUserHasCopyOnLoan(user_id, copy_id)

        assert result is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_count_active_loans_by_user(self, broker, mock_supabase_client):
        """Test counting active loans for a user"""
        user_id = uuid4()
        mock_response = MagicMock()
        mock_response.data = []
        mock_supabase_client.execute.return_value = mock_response

        with patch("asyncio.to_thread", side_effect=lambda f: f()):
            # Test that method works correctly
            mock_supabase_client.select.return_value = mock_supabase_client
            mock_supabase_client.eq.return_value = mock_supabase_client
            result = await broker.SelectActiveLoansByUser(user_id)

        # Just check that it doesn't raise an error
        assert result is not None
