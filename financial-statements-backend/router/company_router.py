from fastapi import APIRouter, HTTPException
from service.company_service import CompanyService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/companies",
    tags=["company list"]
)

@router.get("/")
async def get_companies():
    try:
        logger.info("Fetching company list")
        companies = CompanyService.get_corp_codes()
        logger.info(f"Successfully fetched {len(companies)} companies")
        return companies
    except Exception as e:
        logger.error(f"Error fetching company list: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update")
async def update_companies():
    try:
        logger.info("Updating company list")
        updated_count = CompanyService.update_company_list()
        logger.info(f"Successfully updated company list. {updated_count} companies processed.")
        return {"message": f"Company list updated successfully. {updated_count} companies processed."}
    except Exception as e:
        logger.error(f"Error updating company list: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))