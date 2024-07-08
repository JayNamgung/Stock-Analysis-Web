import requests
import xml.etree.ElementTree as ET
import logging
import psycopg2
from io import BytesIO
from zipfile import ZipFile
from datetime import datetime
from utils.config_loader import load_api_key, load_db_config

logger = logging.getLogger(__name__)

class CompanyService:
    schema_updated = False

    @staticmethod
    def _get_db_connection():
        db_config = load_db_config()
        try:
            conn = psycopg2.connect(**db_config)
            logger.info("데이터베이스 연결 성공")
            return conn
        except psycopg2.Error as e:
            logger.error(f"데이터베이스 연결 실패: {e}")
            raise

    @classmethod
    def get_api_key(cls):
        return load_api_key("OPEN_DART_API_KEY")

    @classmethod
    def ensure_database_schema(cls):
        if cls.schema_updated:
            return

        conn = cls._get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    corp_code TEXT PRIMARY KEY,
                    corp_name TEXT NOT NULL,
                    stock_code TEXT,
                    modify_date DATE,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Check if last_updated column exists, if not, add it
            cur.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint 
                        WHERE conname = 'companies_corp_code_key'
                    ) THEN
                        ALTER TABLE companies ADD CONSTRAINT companies_corp_code_key UNIQUE (corp_code);
                    END IF;
                END $$;
            """)
            
            conn.commit()
            logger.info("companies 테이블 스키마 확인 및 업데이트 완료")
            cls.schema_updated = True
        except psycopg2.Error as e:
            logger.error(f"데이터베이스 스키마 확인 중 오류 발생: {e}")
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()

    @classmethod
    def update_company_list(cls):
        logger.info("상장 기업 목록 업데이트 시작")
        cls.ensure_database_schema()  # 데이터베이스 스키마 확인 및 업데이트
        url = "https://opendart.fss.or.kr/api/corpCode.xml"
        params = {"crtfc_key": cls.get_api_key()}
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            logger.info("DART API로부터 데이터 성공적으로 받아옴")
            
            companies = []
            with ZipFile(BytesIO(response.content)) as zip_file:
                with zip_file.open('CORPCODE.xml') as xml_file:
                    tree = ET.parse(xml_file)
                    root = tree.getroot()
                    
                    for company in root.findall('list'):
                        corp_code = company.findtext('corp_code')
                        corp_name = company.findtext('corp_name')
                        stock_code = company.findtext('stock_code')
                        modify_date = company.findtext('modify_date')
                        
                        # 상장기업만 필터링 (stock_code가 있는 경우)
                        if stock_code and stock_code.strip():
                            if modify_date:
                                modify_date = datetime.strptime(modify_date, '%Y%m%d').strftime('%Y-%m-%d')
                            
                            companies.append((corp_code, corp_name, stock_code, modify_date))
            
            logger.info(f"{len(companies)}개의 상장 회사 정보 파싱 완료")
            cls._save_to_db(companies)
            logger.info("상장 회사 목록 업데이트 완료")
            return len(companies)
        except Exception as e:
            logger.error(f"회사 목록 업데이트 중 오류 발생: {e}")
            raise

    @classmethod
    def _save_to_db(cls, companies):
        conn = cls._get_db_connection()
        cur = conn.cursor()
        
        try:
            # 메인 테이블 생성 (이미 존재하면 무시)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    corp_code TEXT PRIMARY KEY,
                    corp_name TEXT NOT NULL,
                    stock_code TEXT,
                    modify_date DATE,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 임시 테이블 생성
            cur.execute("""
                CREATE TEMP TABLE temp_companies (
                    corp_code TEXT PRIMARY KEY,
                    corp_name TEXT NOT NULL,
                    stock_code TEXT,
                    modify_date DATE
                ) ON COMMIT DROP
            """)
            
            # 임시 테이블에 데이터 삽입
            cur.executemany("""
                INSERT INTO temp_companies (corp_code, corp_name, stock_code, modify_date)
                VALUES (%s, %s, %s, %s)
            """, companies)
            
            # 메인 테이블 업데이트
            cur.execute("""
                INSERT INTO companies (corp_code, corp_name, stock_code, modify_date, last_updated)
                SELECT corp_code, corp_name, stock_code, modify_date, CURRENT_TIMESTAMP
                FROM temp_companies
                ON CONFLICT (corp_code) DO UPDATE
                SET corp_name = EXCLUDED.corp_name,
                    stock_code = EXCLUDED.stock_code,
                    modify_date = EXCLUDED.modify_date,
                    last_updated = CURRENT_TIMESTAMP
            """)

            conn.commit()
            logger.info("데이터베이스 변경사항 커밋 완료")
        except psycopg2.Error as e:
            logger.error(f"데이터베이스 작업 중 오류 발생: {e}")
            conn.rollback()
            raise
        finally:
            cur.close()
            conn.close()
            logger.info("데이터베이스 연결 종료")

    @classmethod
    def get_last_update_time(cls):
        cls.ensure_database_schema()
        conn = cls._get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT MAX(last_updated) FROM companies")
            last_update = cur.fetchone()[0]
            return last_update
        except psycopg2.Error as e:
            logger.error(f"최근 업데이트 시간 조회 중 오류 발생: {e}")
            raise
        finally:
            cur.close()
            conn.close()

    @classmethod
    def get_corp_codes(cls):
        cls.ensure_database_schema()
        conn = cls._get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("SELECT DISTINCT corp_code, corp_name, stock_code FROM companies WHERE 1=1 ORDER BY corp_name")
            companies = cur.fetchall()
            return [{"corp_code": code, "corp_name": name, "stock_code": stock_code} for code, name, stock_code in companies]
        except psycopg2.Error as e:
            logger.error(f"기업 목록 조회 중 오류 발생: {e}")
            raise
        finally:
            cur.close()
            conn.close()