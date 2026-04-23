# sneakerhead/product-service/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.endpoints.products import router as products_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(products_router)
