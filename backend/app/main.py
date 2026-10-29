import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.config import settings, BASE_DIR
from backend.app.db.database import init_db, get_food_count
from backend.app.models.schemas import HealthCheckResponse
from backend.app.routers import nutrition, freshness, hygiene, cooking, planner

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

# Also initialize immediately on module load so test clients have ready DB
init_db()

app = FastAPI(
    title="Food Verse AI - Multimodal Food Intelligence Agent",
    description=(
        "Production-grade REST API powering multimodal food intelligence: "
        "Food Recognition & Calorie Estimation (ICMR-NIN IFCT 2017 & USDA), "
        "Freshness & Spoilage Assessment (Multi-Factor Danger Zone Heuristic), "
        "Kitchen Hygiene & PPE Compliance with Edge Face Anonymization, "
        "Smart Cooking Assistant with USDA-FSIS Thermal Safety Validation, "
        "and Personalized Meal Planner with Deterministic Mifflin-St Jeor & ICMR 2020 RDA."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local development and frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(nutrition.router, prefix=settings.API_PREFIX)
app.include_router(freshness.router, prefix=settings.API_PREFIX)
app.include_router(hygiene.router, prefix=settings.API_PREFIX)
app.include_router(cooking.router, prefix=settings.API_PREFIX)
app.include_router(planner.router, prefix=settings.API_PREFIX)

@app.get("/api/v1/health", response_model=HealthCheckResponse, tags=["System Health"])
def health_check():
    return HealthCheckResponse(
        status="healthy",
        version=settings.VERSION,
        project=settings.PROJECT_NAME,
        python_runtime=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        database_records_loaded=get_food_count(),
        models_ready=True
    )

# Mount frontend production dist if present (unified single-port delivery)
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

@app.get("/{full_path:path}", tags=["Frontend"])
async def serve_spa(full_path: str = ""):
    if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
        raise HTTPException(status_code=404, detail="API route not found")
    file_path = FRONTEND_DIST / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "message": "Welcome to Food Verse AI API",
        "documentation": "/docs",
        "health": "/api/v1/health",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
