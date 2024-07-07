import requests
import xml.etree.ElementTree as ET
from io import BytesIO
from zipfile import ZipFile
import psycopg2
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import requests
import xml.etree.ElementTree as ET
from io import BytesIO
from zipfile import ZipFile
import psycopg2
from datetime import datetime
from utils.config_loader import load_api_key

class CompanyService:
    @staticmethod
    def _get_db_connection():
        return psycopg2.connect(
            dbname="your_database_name",
            user="your_username",
            password="your_password",
            host="localhost"
        )

    @staticmethod
    def update_company_list():
        url = "https://opendart.fss.or.kr/api/corpCode.xml"
        api_key = load_api_key("OPEN_DART_API_KEY")
        params = {"crtfc_key": api_key}
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            raise Exception(f"API 요청 실패: {response.status_code}")
        
        companies = []
        with ZipFile(BytesIO(response.content)) as zip_file:
            with zip_file.open('CORPCODE.xml') as xml_file:
                tree = ET.parse(xml_file)
                root = tree.getroot()
                
                for company in root.findall('list'):
                    corp_code = company.findtext('corp_code')
                    corp_name = company.findtext('corp_name')
                    stock_code = company.findtext('stock_code') or ''
                    modify_date = company.findtext('modify_date')
                    
                    if modify_date:
                        modify_date = datetime.strptime(modify_date, '%Y%m%d').strftime('%Y-%m-%d')
                    
                    companies.append((corp_code, corp_name, stock_code, modify_date))
        
        with CompanyService._get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS companies (
                        corp_code TEXT PRIMARY KEY,
                        corp_name TEXT NOT NULL,
                        stock_code TEXT,
                        modify_date DATE
                    )
                """)
                
                cur.execute("TRUNCATE TABLE companies")
                
                cur.executemany("""
                    INSERT INTO companies (corp_code, corp_name, stock_code, modify_date)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (corp_code) DO UPDATE
                    SET corp_name = EXCLUDED.corp_name,
                        stock_code = EXCLUDED.stock_code,
                        modify_date = EXCLUDED.modify_date
                """, companies)
                
                conn.commit()
        
        return len(companies)

    @staticmethod
    def get_company_list():
        with CompanyService._get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT corp_code, corp_name, stock_code, modify_date FROM companies")
                companies = cur.fetchall()
        
        return [{"corp_code": code, "corp_name": name, "stock_code": stock_code, "modify_date": modify_date} 
                for code, name, stock_code, modify_date in companies]