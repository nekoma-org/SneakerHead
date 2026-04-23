# sneakerhead/order-service/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.endpoints.cart import router as cart_router
from app.api.v1.endpoints.orders import router as orders_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(cart_router)
api_router.include_router(orders_router)
