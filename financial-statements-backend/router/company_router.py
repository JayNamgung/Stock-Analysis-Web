from fastapi import APIRouter, HTTPException
from service.company_service import CompanyService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/company-list",
    tags=["company list"]
)

@router.get("/")
async def get_companies():
    try:
        companies = CompanyService.get_company_list()
        return companies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-companies")
async def update_companies():
    try:
        updated_count = CompanyService.update_company_list()
        return {"message": f"Company list updated successfully. {updated_count} companies processed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))