# **Test Summary**

- **Location**: `backend/tests/` — contains unit, integration and specification tests for Django REST API services.

- **Run all tests**: `python manage.py test tests --settings=tests.settings_test` (uses in-memory SQLite)

**Quick Run**

- Run only unit tests: `python manage.py test tests.unit --settings=tests.settings_test` or `python manage.py test tests/unit --settings=tests.settings_test`
- Run only integration tests: `python manage.py test tests.integration --settings=tests.settings_test` or `python manage.py test tests/integration --settings=tests.settings_test`
- Run only specification tests: `python manage.py test tests.spec --settings=tests.settings_test` or `python manage.py test tests/spec --settings=tests.settings_test`
- Run wallet helper tests: `python manage.py test tests.unit.test_wallet_helpers --settings=tests.settings_test`
- Run wallet API tests: `python manage.py test tests.integration.test_wallet_api --settings=tests.settings_test`
- Run password validation tests: `python manage.py test tests.spec.test_password_validation --settings=tests.settings_test`

**What this test suite covers**

- **Unit tests**: Simple helper function logic (`_adjust_wallet_balance`). These tests use Django's test database and test wallet balance calculations in isolation.

- **Integration tests**: API endpoint tests using Django's test client (`APIClient`) to validate HTTP response codes, authentication, and wallet deposit functionality.

- **Specification tests**: Property-based validation checks for password strength requirements (uppercase, number, special character, minimum length).

**Files & Purpose**

- `backend/tests/settings_test.py`
  - Test-specific Django settings (uses SQLite in-memory database for faster test execution). Use `--settings=tests.settings_test` when running tests.

**Unit tests (mocked dependencies)**

- `backend/tests/unit/test_wallet_helpers.py`
  - Tests for wallet helper function: `_adjust_wallet_balance`.
  - Tests wallet balance calculations: adding money, subtracting money, and handling zero balance.
  - Uses Django's test database. Focused on main happy-paths for balance adjustment operations.
  - **Test cases:**
    - `test_adjust_wallet_balance_adds_money`: Verifies adding money increases balance correctly
    - `test_adjust_wallet_balance_subtracts_money`: Verifies subtracting money decreases balance correctly
    - `test_adjust_wallet_balance_handles_zero_balance`: Verifies function works correctly with zero initial balance

**Integration tests (Django test client)**

- `backend/tests/integration/test_wallet_api.py`
  - Tests wallet deposit API endpoint through HTTP requests.
  - Tests JWT authentication flow and wallet deposit functionality.
  - Uses `APIClient` to make HTTP requests and validate responses.
  - **Test cases:**
    - `test_deposit_money_to_wallet`: Tests complete deposit flow - get balance, deposit money, verify new balance
    - `test_deposit_requires_authentication`: Tests that deposit endpoint requires valid JWT authentication

**Specification tests (property-based validation)**

- `backend/tests/spec/test_password_validation.py`
  - Property-based tests for password validation: password strength requirements enforced by `UserSerializer`.
  - Tests edge cases and boundary conditions for password validation rules.
  - **Test cases:**
    - `test_password_must_have_uppercase_letter`: Validates password must contain at least one uppercase letter
    - `test_password_must_have_number`: Validates password must contain at least one number
    - `test_password_must_have_special_character`: Validates password must contain at least one special character
    - `test_password_must_be_at_least_8_characters`: Validates password must be at least 8 characters long
    - `test_valid_password_passes_validation`: Validates that a password meeting all requirements passes validation

**Mocking & Patterns**

- **Database**: Django's test framework automatically creates a test database. Uses `TestCase` for database-backed tests. Test settings use SQLite in-memory database for faster execution.

- **Authentication**: Integration tests use `APIClient` with `credentials()` method to set JWT tokens: `client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')`.

- **Test Data**: Test fixtures created in `setUp()` method. Uses Django's `create_user()` and model `create()` methods for test data setup.

- **HTTP Requests**: Integration tests use Django REST Framework's `APIClient` to make HTTP requests without starting a full server.

**Why some tests were simplified/removed**

- Tests are intentionally simple and focused on core functionality: wallet operations, API endpoints, and validation rules.
- Complex scenarios (e.g., concurrent transactions, edge cases with multiple users) are kept simple to maintain clarity.
- Tests focus on one responsibility per test case for easy understanding and maintenance.

**Notes for reviewers / course submission**

- The tests are intentionally simple and focused on demonstrating basic testing concepts: unit testing, integration testing, and specification testing.
- Backend tests use Django's built-in test framework for consistency and database management.
- Each test file focuses on one feature/functionality to maintain clarity and maintainability.
- Tests are designed to be easy to understand and explain in a presentation.

**Test Coverage**

- **Unit Tests**: Wallet helper function (`_adjust_wallet_balance`) - 3 test cases covering balance adjustments
- **Integration Tests**: Wallet deposit API endpoint - 2 test cases covering deposit flow and authentication
- **Specification Tests**: Password validation rules - 5 test cases covering all password requirements

**Next steps / recommendations**

- Add more unit tests for other wallet helper functions (`_get_wallet`, `_record_wallet_transaction`)
- Add integration tests for other API endpoints (order creation, delivery acceptance)
- Add specification tests for other validation rules (email format, phone number format, pincode validation)
- Add `coverage.py` for test coverage reporting: `pip install coverage && coverage run manage.py test && coverage report`
- Consider adding `factory-boy` for Django model factories to simplify test data creation

**Running Tests**

cd backend

# Run all tests with SQLite test settings
python manage.py test tests --settings=tests.settings_test

# Run specific groups
python manage.py test tests.unit tests.integration tests.spec --settings=tests.settings_test

# Run a single file
python manage.py test tests.integration.test_wallet_api --settings=tests.settings_test