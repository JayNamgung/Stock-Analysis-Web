import requests
import time
import logging
import os
from typing import List, Dict
from utils.config_loader import load_api_key

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "https://opendart.fss.or.kr/api"

class FinancialStatementService:
    
    @staticmethod
    def get_api_key():
        return load_api_key("OPEN_DART_API_KEY")

    @staticmethod
    def get_financial_statement(cls, corp_code: str, bsns_year: str, reprt_code: str, fs_div: str) -> Dict:
        url = f"{BASE_URL}/fnlttSinglAcntAll.json"
        params = {
            "crtfc_key": cls.get_api_key(),
            "corp_code": corp_code,
            "bsns_year": bsns_year,
            "reprt_code": reprt_code,
            "fs_div": fs_div
        }

        logger.info(f"Sending request to {url} with params: {params}")

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            logger.info(f"Received response: {response.text}")

            data = response.json()
            
            if 'status' in data and data['status'] != '000':
                logger.error(f"API 오류: {data['message']}")
                return {"error": data['message']}
            
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"요청 중 오류 발생: {e}")
            return {"error": "데이터를 불러오는 데 실패했습니다."}

    @classmethod
    def fetch_all_financials(cls, year: str, quarter: str) -> List[Dict]:
        corps = cls.get_corp_codes()
        all_financials = []
        
        for _, corp in corps.iterrows():
            logger.info(f"조회 중: {corp['corp_name']} ({corp['stock_code']})")
            financials = cls.get_financial_statement(corp['corp_code'], year, quarter, "OFS")
            if financials and 'list' in financials:
                for item in financials['list']:
                    item.update({
                        'corp_name': corp['corp_name'],
                        'stock_code': corp['stock_code']
                    })
                all_financials.extend(financials['list'])
            
            time.sleep(1)  # API 호출 간 1초 대기 (API 사용량 제한 고려)
        
        return all_financials