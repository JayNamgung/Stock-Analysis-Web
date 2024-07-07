from fastapi import APIRouter, BackgroundTasks, HTTPException
from service.financial_statement_service import FinancialStatementService
from typing import Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/financial-statements",
    tags=["financial statements"]
)

@router.get("/{corp_code}")
async def get_financial_statement(
    corp_code: str,
    bsns_year: str,
    reprt_code: str,
    fs_div: str = "OFS"
) -> Dict:
    try:
        return FinancialStatementService.get_financial_statement(corp_code, bsns_year, reprt_code, fs_div)
    except Exception as e:
        logger.error(f"Error getting financial statement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/all")
async def start_all_financial_statements(background_tasks: BackgroundTasks, year: str, quarter: str) -> Dict:
    try:
        background_tasks.add_task(FinancialStatementService.fetch_all_financials, year, quarter)
        return {"message": "재무제표 데이터 수집이 백그라운드에서 시작되었습니다."}
    except Exception as e:
        logger.error(f"Error starting financial statements collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 이 부분은 실제 상태 추적 로직으로 대체해야 합니다
@router.get("/status")
async def get_financial_statements_status() -> Dict:
    # TODO: 실제 작업 상태를 추적하고 반환하는 로직 구현
    return {"status": "진행 중"}