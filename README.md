# Home Eats 🍱

A full-stack web application connecting customers with homemade food providers and delivery personnel.

## Features

- 🔐 Multiple user roles (Customer, Tiffin Owner, Delivery Boy)
- 🏠 Location-based tiffin service search
- 📱 Responsive design for mobile and desktop
- 🔄 Real-time order tracking
- 🎨 Modern UI inspired by food delivery apps

## Tech Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React
- **Database**: PostgreSQL (Home_db)
- **Authentication**: JWT

## Project Structure

```
home-eats/
├── backend/           # Django backend
│   ├── api/          # REST API endpoints
│   ├── core/         # Core Django settings
│   └── users/        # User management
└── frontend/         # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── public/
```

## Setup Instructions

### Backend Setup

1. Create and activate a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=Home_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

**Note**: The database name defaults to `Home_db` if `DB_NAME` is not set in the environment variables.

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
```

## API Documentation

The API documentation is available at `http://localhost:8000/api/docs/` when running the backend server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 