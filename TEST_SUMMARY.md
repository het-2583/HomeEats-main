# **Test Summary**

- **Location**: 
  - **Backend**: `backend/tests/` — contains unit, integration and specification tests for Django REST API services.
  - **Frontend**: `frontend/src/__tests__/` — contains unit and integration tests for React components and Redux slices.

- **Run all tests**: 
  - **Backend**: `python manage.py test` (runs Django test suite)
  - **Frontend**: `npm test` (runs Jest with React Testing Library)

**Quick Run**

**Backend:**
- Run only unit tests: `python manage.py test tests.unit` or `python manage.py test tests/unit`
- Run only integration tests: `python manage.py test tests.integration` or `python manage.py test tests/integration`
- Run only serializer tests: `python manage.py test tests.unit.test_serializers`
- Run only viewset tests: `python manage.py test tests.unit.test_viewsets`
- Run wallet helper tests: `python manage.py test tests.unit.test_wallet_helpers`

**Frontend:**
- Run only component tests: `npm test -- src/__tests__/components` or `npx jest src/__tests__/components`
- Run only Redux tests: `npm test -- src/__tests__/redux` or `npx jest src/__tests__/redux`
- Run only page tests: `npm test -- src/__tests__/pages` or `npx jest src/__tests__/pages`

**What this test suite covers**

- **Unit tests**: ViewSet logic (happy paths and key error cases), serializer validation, wallet helper functions, and Redux slice logic. These tests use Django's test database and mock external services where needed.

- **Integration tests**: API endpoint tests using Django's test client to validate HTTP response codes, authentication, and data shapes. Frontend integration tests cover component integration with Redux store, routing, and API calls using mocked axios.

- **Specification tests**: Property-based validation checks for serializers and model constraints (password strength, phone number format, pincode validation, price validation).

**Files & Purpose**

- `backend/tests/settings_test.py`
  - Test-specific Django settings (uses SQLite in-memory database).

**Unit tests (mocked dependencies)**

- `backend/tests/unit/test_viewsets.py`
  - Tests for ViewSet classes: `UserViewSet`, `TiffinViewSet`, `OrderViewSet`, `DeliveryViewSet`, `WalletViewSet`, `BankAccountViewSet`.
  - Tests authentication, authorization, CRUD operations, and business logic flows. Uses Django's test database and `APIClient` for authenticated requests. Focused on main happy-paths and key error cases (insufficient balance, unauthorized access, validation errors).

- `backend/tests/unit/test_serializers.py`
  - Tests for serializer validation: `UserSerializer`, `TiffinSerializer`, `OrderSerializer`, `DeliverySerializer`.
  - Tests password validation, field validation, nested object creation (TiffinOwner, DeliveryBoy profiles). Validates serializer output format and read-only fields.

- `backend/tests/unit/test_wallet_helpers.py`
  - Unit tests for wallet helper functions: `_get_wallet`, `_adjust_wallet_balance`, `_record_wallet_transaction`, `_credit_owner_for_order`, `_transfer_delivery_fee`.
  - Tests wallet balance calculations, transaction recording, and delivery fee transfers. Validates error handling for insufficient balance scenarios.

- `frontend/src/__tests__/redux/authSlice.test.js`
  - Tests Redux auth slice: `login`, `register`, `fetchUserProfile`, `logout` actions.
  - Uses `jest.spyOn` to mock axios calls and localStorage. Tests success and error handling, token storage, and state updates.

- `frontend/src/__tests__/components/PrivateRoute.test.js`
  - Tests `PrivateRoute` component: authentication checks, role-based access control.
  - Mocks Redux store and React Router. Tests redirect behavior for unauthenticated users and wrong role access.

- `frontend/src/__tests__/components/Navbar.test.js`
  - Tests `Navbar` component: rendering, navigation links, logout functionality.
  - Tests conditional rendering based on authentication state.

**Integration tests (Django test client + React Testing Library)**

- `backend/tests/integration/test_auth_flow.py`
  - Tests complete authentication flows: user registration, login, token refresh, and profile retrieval.
  - Tests JWT token generation and validation.

- `backend/tests/integration/test_order_flow.py`
  - Tests complete order lifecycle: order creation, status updates, wallet deductions, owner credits, and delivery assignment.
  - Validates database transactions and wallet operations work together correctly.

- `backend/tests/integration/test_delivery_flow.py`
  - Tests delivery acceptance flow: delivery boy accepting delivery, fee transfer from owner to delivery boy, status updates.
  - Validates role-based access control and financial transactions.

- `frontend/src/__tests__/pages/Login.test.js`
  - Tests `Login` page: form rendering, input validation, API calls, error handling.
  - Uses React Testing Library to simulate user interactions. Tests integration with Redux store and navigation.

- `frontend/src/__tests__/pages/Register.test.js`
  - Tests `Register` page: form fields, validation, user type selection, API calls.
  - Tests conditional fields based on user type (owner, delivery, customer).

- `frontend/src/__tests__/pages/CustomerDashboard.test.js`
  - Tests `CustomerDashboard`: tiffin listing, search, filtering, order placement.
  - Mocks API calls and tests Redux state updates.

- `frontend/src/__tests__/pages/OwnerDashboard.test.js`
  - Tests `OwnerDashboard`: order management, status updates, tiffin CRUD operations.
  - Tests role-based functionality.

- `frontend/src/__tests__/pages/Wallet.test.js`
  - Tests `Wallet` page: balance display, transaction history, deposit/withdraw flows.
  - Tests wallet operations and API integration.

**Specification tests (property-based validation)**

- `backend/tests/spec/test_user_validation.py`
  - Property-based tests for user registration: password strength, phone number format, pincode validation, email format.
  - Tests edge cases and boundary conditions.

- `backend/tests/spec/test_tiffin_validation.py`
  - Property-based tests for tiffin creation: price validation (positive, decimal places), name/description length, availability status.

- `backend/tests/spec/test_order_validation.py`
  - Property-based tests for order creation: quantity validation (positive integers), address format, pincode validation.

**Mocking & Patterns**

- **Database**: Django's test framework automatically creates a test database. Use `TestCase` for database-backed tests and `TransactionTestCase` for transaction testing. For mocking, use `unittest.mock` or `pytest-mock` to mock external API calls.

- **Authentication**: Use `APIClient` with `credentials()` method to set JWT tokens: `client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')`.

- **Frontend API Calls**: Mock axios using `jest.mock('axios')` and `axios.post.mockResolvedValue()` or `mockRejectedValue()`.

- **Redux Store**: Create mock stores using `configureStore` from Redux Toolkit with preloaded state.

- **React Router**: Mock navigation using `jest.mock('react-router-dom')` and provide `useNavigate` mock.

- **LocalStorage**: Mock localStorage using `jest.spyOn(Storage.prototype, 'getItem')` and `setItem`.

**Why some tests were simplified/removed**

- Complex database cascade operations (e.g., deleting users with orders) are tested at integration level rather than unit level to avoid flakiness.
- Image upload tests are simplified to test file validation without actual file storage.
- Real-time features (if any) are mocked to keep tests deterministic.
- Tests that require external services (e.g., payment gateways) are mocked to avoid dependencies.

**Notes for reviewers / course submission**

- The tests are intentionally focused on core functionality: authentication, authorization, CRUD operations, and financial transactions (wallet operations).
- Backend tests use Django's built-in test framework for consistency and database management.
- Frontend tests use Jest and React Testing Library following React best practices.
- Each test file focuses on one component/feature to maintain clarity and maintainability.

**Next steps / recommendations**

- Add `pytest` and `pytest-django` for more advanced testing features (fixtures, parametrization).
- Add `factory-boy` for Django model factories to simplify test data creation.
- Add `coverage.py` for backend test coverage reporting: `pip install coverage && coverage run manage.py test && coverage report`.
- Add `@testing-library/user-event` for more realistic user interaction simulation in frontend tests.
- Consider adding E2E tests with Cypress or Playwright for critical user journeys (order placement, delivery acceptance).
- Add performance tests for wallet operations to ensure transactions are fast and atomic.
