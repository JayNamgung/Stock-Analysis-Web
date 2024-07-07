import requests
import pandas as pd
from io import BytesIO
from zipfile import ZipFile
import time
import xml.etree.ElementTree as ET
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = ""
BASE_URL = "https://opendart.fss.or.kr/api"

class FinancialStatementService:
    @staticmethod
    def get_corp_codes() -> pd.DataFrame:
        url = f"{BASE_URL}/corpCode.xml"
        params = {"crtfc_key": API_KEY}
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            with ZipFile(BytesIO(response.content)) as zip_file:
                with zip_file.open('CORPCODE.xml') as xml_file:
                    df = pd.read_xml(xml_file)
            return df[df['stock_code'].notna()][['corp_code', 'corp_name', 'stock_code']]
        else:
            raise Exception(f"API 요청 실패: {response.status_code}")

    @staticmethod
    def get_financial_statement(corp_code: str, bsns_year: str, reprt_code: str, fs_div: str) -> Dict:
        url = f"{BASE_URL}/fnlttSinglAcntAll.json"
        params = {
            "crtfc_key": API_KEY,
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
    
    @staticmethod
    def get_company_list() -> List[Dict]:
        url = f"{BASE_URL}/corpCode.xml"
        params = {'crtfc_key': API_KEY}

        logger.info(f"Requesting company list from {url}")
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raises an HTTPError for bad responses
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch company list: {e}")
            raise Exception(f"API request failed: {str(e)}")

        logger.info("Successfully fetched company list. Parsing data...")
        try:
            with ZipFile(BytesIO(response.content)) as zip_file:
                xml_data = zip_file.read('CORPCODE.xml')

            root = ET.fromstring(xml_data)
            companies = []
            for company in root.findall('list'):
                corp_code = company.findtext('corp_code')
                company_name = company.findtext('corp_name')
                stock_code = company.findtext('stock_code')
                if stock_code:  # 주식 코드가 있는 기업만 리스트에 추가 (상장 기업)
                    companies.append({
                        'code': corp_code,
                        'name': company_name,
                        'stock_code': stock_code
                    })
            
            logger.info(f"Parsed {len(companies)} companies")
            return companies
        except Exception as e:
            logger.error(f"Error parsing company data: {e}")
            raise Exception(f"Failed to parse company data: {str(e)}")