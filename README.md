# NeuraX Web Application

Full-stack web application with React frontend and FastAPI backend.

## Project Structure

```
neurax-web-app/
├── frontend/          # React + Vite application
│   ├── src/           # React source files
│   ├── public/        # Static assets
│   ├── package.json   # Node dependencies
│   └── Dockerfile     # Frontend container configuration
├── backend/           # FastAPI Python application
│   ├── main.py        # FastAPI main application
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile     # Backend container configuration
└── README.md          # This file
```

## Prerequisites

- **Node.js** (v18 or higher) and npm
- **Python** (v3.11 or higher) and pip
- **Docker** (optional, for containerized deployment)

## Running Locally

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Access the backend at:
   - API: http://localhost:8000
   - Interactive API docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

### Frontend (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Access the frontend at: http://localhost:5173

## Running with Docker

### Backend

```bash
cd backend
docker build -t neurax-backend .
docker run -p 8000:8000 neurax-backend
```

### Frontend

```bash
cd frontend
docker build -t neurax-frontend .
docker run -p 80:80 neurax-frontend
```

## AWS Deployment

Both services include Dockerfiles optimized for AWS deployment:

- **Backend**: Uses Python 3.11-slim image, includes boto3 for AWS SDK integration
- **Frontend**: Multi-stage build with nginx for efficient static file serving

### Deployment Options

- **AWS ECS/Fargate**: Use the Dockerfiles with Amazon ECS or Fargate
- **AWS App Runner**: Direct deployment from container images
- **AWS Elastic Beanstalk**: Docker platform deployment

## Development Commands

### Backend

- Run tests: `pytest` (after adding tests)
- Format code: `black .` (after installing black)
- Lint: `flake8` (after installing flake8)

### Frontend

- Build for production: `npm run build`
- Preview production build: `npm run preview`
- Lint code: `npm run lint`

## API Endpoints

### Backend

- `GET /` - Hello World endpoint
  - Response: `{"message": "Hello World"}`

## Environment Variables

Create `.env` files in each directory for environment-specific configuration:

### Backend `.env` example:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Frontend `.env` example:
```
VITE_API_URL=http://localhost:8000
```

## NeuraX SE Team Notes

- Both services are configured for hot-reload during development
- Backend uses FastAPI with automatic interactive documentation
- Frontend uses Vite for fast HMR (Hot Module Replacement)
- Docker images are optimized for AWS deployment
- Backend includes boto3 for AWS service integration

## Troubleshooting

### Backend
- If port 8000 is in use, change the port: `uvicorn main:app --port 8001`
- Ensure virtual environment is activated before installing packages

### Frontend
- If port 5173 is in use, Vite will automatically try the next available port
- Clear node_modules and reinstall if you encounter dependency issues: `rm -rf node_modules && npm install`

## Contributing

For the NeuraX SE Team:
1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## License

Internal NeuraX project