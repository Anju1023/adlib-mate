from fastapi import FastAPI
from backend.app.api.v1.endpoints import router as api_v1_router

app = FastAPI(title="Ad-lib Mate API")

app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to Ad-lib Mate API", "version": "1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
