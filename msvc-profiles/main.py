from fastapi import FastAPI
from logger import logger

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up msvc-profiles service.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down msvc-profiles service.")

@app.get("/")
async def root():
    logger.info("Root endpoint was called.")
    return {"message": "msvc-profiles is running."}

