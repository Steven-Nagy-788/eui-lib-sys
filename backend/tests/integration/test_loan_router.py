"""
Integration tests for LoanRouter
Tests API endpoints with mocked authentication
"""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from src.main import app


class TestLoanRouter:
    """Test suite for Loan API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture(autouse=True)
    def setup_auth(self, mock_admin_user, mock_student_user):
        """Setup auth dependency overrides for each test"""
        from src.utils.auth import get_current_user, require_admin

        # Override dependencies
        app.dependency_overrides[get_current_user] = lambda: mock_student_user
        app.dependency_overrides[require_admin] = lambda: mock_admin_user

        yield

        # Clean up overrides
        app.dependency_overrides.clear()

    @pytest.mark.integration
    def test_get_all_loans(self, client):
        """Test GET /loans - retrieve all loans"""
        response = client.get("/loans")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.integration
    def test_get_loan_by_id(self, client):
        """Test GET /loans/{id} - retrieve specific loan"""
        loan_id = uuid4()
        response = client.get(f"/loans/{loan_id}")

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_create_loan_request(self, client):
        """Test POST /loans - create new loan request"""
        loan_data = {"copy_id": str(uuid4())}

        response = client.post("/loans", json=loan_data)

        # May fail with validation, but tests endpoint exists
        assert response.status_code in [201, 400, 404, 422]

    @pytest.mark.integration
    def test_get_user_loans(self, client):
        """Test GET /loans/user/{user_id} - get loans for specific user"""
        user_id = uuid4()
        response = client.get(f"/loans/user/{user_id}")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.integration
    def test_approve_loan(self, client):
        """Test POST /loans/{id}/approve - approve loan request"""
        loan_id = uuid4()

        response = client.post(f"/loans/{loan_id}/approve")

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_reject_loan(self, client):
        """Test POST /loans/{id}/reject - reject loan request"""
        loan_id = uuid4()
        reject_data = {"reason": "Not available"}

        response = client.post(f"/loans/{loan_id}/reject", json=reject_data)

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_checkout_loan(self, client):
        """Test POST /loans/{id}/checkout - checkout approved loan"""
        loan_id = uuid4()

        response = client.post(f"/loans/{loan_id}/checkout")

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_return_loan(self, client):
        """Test POST /loans/{id}/return - return checked out loan"""
        loan_id = uuid4()
        return_data = {"condition": "good"}

        response = client.post(f"/loans/{loan_id}/return", json=return_data)

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_cancel_loan(self, client):
        """Test POST /loans/{id}/cancel - cancel loan request"""
        loan_id = uuid4()

        response = client.post(f"/loans/{loan_id}/cancel")

        assert response.status_code in [200, 404]

    @pytest.mark.integration
    def test_get_overdue_loans(self, client):
        """Test GET /loans/overdue - get all overdue loans"""
        response = client.get("/loans/overdue")

        assert response.status_code == 200
        assert isinstance(response.json(), list)
