from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from scalar_fastapi import get_scalar_api_reference
from dotenv import load_dotenv
import sys
from pathlib import Path

# Add the parent directory to the path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

# Import routers
from .routers.userRouter import router as user_router
from .routers.bookRouter import router as book_router
from .routers.bookCopyRouter import router as book_copy_router
from .routers.courseRouter import router as course_router
from .routers.loanRouter import router as loan_router
from .routers.statsRouter import router as stats_router
from .config import get_supabase

# ============================================
# FASTAPI APP INITIALIZATION
# ============================================
app = FastAPI(
    title="Library System API",
    version="1.0.0",
    description="""
    Library Management System.
    """,
    docs_url=None,  # Disable default Swagger
    redoc_url=None   # Disable ReDoc
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(book_router)
app.include_router(book_copy_router)
app.include_router(course_router)
app.include_router(loan_router)
app.include_router(stats_router)


@app.get("/docs", include_in_schema=False)
async def scalar_html():
    """Scalar API documentation"""
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
    )

# ============================================
# ROOT ENDPOINT
# ============================================
@app.get("/", tags=["Health Check"])
async def root(): 
    """(Scalar API Documentation) check"""
    try:
        # Test database connection
        db = get_supabase()
        return {
            "message": "Library System API",
            "status": "running",
            "version": "1.0.0",
            "database": "connected",
            "endpoints": {
                "docs": "/docs",
                "redoc": "/redoc",
                "users": "/users"
            }
        }
    except Exception as e:
        return {
            "message": "Library System API",
            "status": "running",
            "version": "1.0.0",
            "database": "error",
            "error": str(e)
        }

@app.get("/health", tags=["Health Check"])
async def health_check():
    """Detailed health check endpoint"""
    try:
        db = get_supabase()
        # Try a simple query to verify connection
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2025-12-18"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# ============================================
# STARTUP & SHUTDOWN EVENTS
# ============================================
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("=" * 60)
    print("🚀 Library System API starting up...")
    print("=" * 60)
    try:
        db = get_supabase()
        print("✅ Database connection initialized successfully")
        print(f"📍 API Docs available at: http://localhost:8000/docs")
        print(f"📍 User endpoints available at: http://localhost:8000/users")
        print("=" * 60)
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("=" * 60)
    print("👋 Library System API shutting down...")
    print("=" * 60)


# ============================================
# RUN COMMAND:
# uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
# 
# Or from project root:
# python -m uvicorn src.main:app --reload
# ============================================
