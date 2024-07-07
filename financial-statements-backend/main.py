from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from router.financial_statement_router import router as financial_statement_router
from router.company_router import router as company_router
import logging
from logging.handlers import RotatingFileHandler
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# 로그 디렉토리 생성
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# 로깅 설정
log_file = os.path.join(log_dir, "backend.log")
logging.basicConfig(level=logging.INFO)
file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

# root logger에 파일 핸들러 추가
logging.getLogger('').addHandler(file_handler)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱의 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(financial_statement_router)
app.include_router(company_router)

@app.get("/")
def read_root():
    return {"message": "금융 데이터 API"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"An unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": f"An internal server error occurred: {str(exc)}"},
    )

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting the application")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, debug=True)