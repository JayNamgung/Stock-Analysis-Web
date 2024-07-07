from fastapi import APIRouter, BackgroundTasks, HTTPException
from service.financial_statement_service import FinancialStatementService
from typing import Dict, List
import pandas as pd
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/financial-statements",
    tags=["financial statements"]
)

class FinancialStatementRouter:
    @router.get("/{corp_code}")
    async def get_financial_statement(
        corp_code: str,
        bsns_year: str,
        reprt_code: str,
        fs_div: str = "OFS"
    ) -> Dict:
        return FinancialStatementService.get_financial_statement(corp_code, bsns_year, reprt_code, fs_div)

    @router.get("/all")
    async def get_all_financial_statements(background_tasks: BackgroundTasks, year: str, quarter: str) -> Dict:
        background_tasks.add_task(FinancialStatementService.fetch_all_financials, year, quarter)
        return {"message": "재무제표 데이터 수집이 백그라운드에서 시작되었습니다."}

    @router.get("/status")
    async def get_financial_statements_status() -> Dict:
        return {"status": "진행 중"}  # 임시 응답

    @router.get("/companies")
    async def get_companies() -> List[Dict]:
        try:
            return FinancialStatementService.get_company_list()
        except Exception as e:
            logger.error(f"Error fetching company list: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def fetch_and_save_all_financials(year: str, quarter: str):
        all_financials = FinancialStatementService.fetch_all_financials(year, quarter)
        df = pd.DataFrame(all_financials)
        df.to_csv(f"all_companies_financials_{year}_{quarter}.csv", index=False, encoding='utf-8-sig')
        print("재무제표 데이터 저장 완료")