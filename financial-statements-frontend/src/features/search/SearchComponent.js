import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SearchComponent() {
  const [companyName, setCompanyName] = useState('');
  const [corpCode, setCorpCode] = useState('');
  const [bsnsYear, setBsnsYear] = useState('');
  const [reprtCode, setReprtCode] = useState('');
  const [fsDiv, setFsDiv] = useState('OFS');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);

  const reprtCodeOptions = [
    { value: '11013', label: '1분기보고서' },
    { value: '11012', label: '반기보고서' },
    { value: '11014', label: '3분기보고서' },
    { value: '11011', label: '사업보고서' }
  ];

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/financial-statements/companies');
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('기업 목록을 불러오는데 실패했습니다.');
      }
    };

    fetchCompanies();
  }, []);

  const handleCompanyChange = (e) => {
    const selectedCompany = companies.find(company => company.name === e.target.value);
    setCompanyName(e.target.value);
    if (selectedCompany) {
      setCorpCode(selectedCompany.code);
    }
  };

  const handleSearch = async () => {
    try {
      setError('');
      setResult(null);
      if (!corpCode || !bsnsYear || !reprtCode) {
        setError('모든 필드를 선택해주세요.');
        return;
      }
      console.log(`Sending request for corp_code: ${corpCode}, bsns_year: ${bsnsYear}, reprt_code: ${reprtCode}, fs_div: ${fsDiv}`);
      const url = `http://localhost:8000/api/v1/financial-statements/${corpCode}`;
      const response = await axios.get(url, {
        params: {
          bsns_year: bsnsYear,
          reprt_code: reprtCode,
          fs_div: fsDiv
        }
      });
      console.log('Response:', response.data);
      setResult(response.data);
    } catch (err) {
      console.error('Error details:', err.response ? err.response.data : err.message);
      setError('데이터를 불러오는 데 실패했습니다. 입력 값을 확인해주세요.');
    }
  };

  return (
    <div>
      <h2>기업 재무제표 검색</h2>
      <select
        value={companyName}
        onChange={handleCompanyChange}
      >
        <option value="">기업을 선택하세요</option>
        {companies.map(company => (
          <option key={company.code} value={company.name}>{company.name}</option>
        ))}
      </select>
      <select
        value={bsnsYear}
        onChange={(e) => setBsnsYear(e.target.value)}
      >
        <option value="">사업연도 선택</option>
        {yearOptions.map(year => (
          <option key={year.value} value={year.value}>{year.label}</option>
        ))}
      </select>
      <select
        value={reprtCode}
        onChange={(e) => setReprtCode(e.target.value)}
      >
        <option value="">보고서 선택</option>
        {reprtCodeOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        value={fsDiv}
        onChange={(e) => setFsDiv(e.target.value)}
      >
        <option value="OFS">개별</option>
        <option value="CFS">연결</option>
      </select>
      <button onClick={handleSearch}>검색</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div>
          <h3>{result.corp_name} 재무제표</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SearchComponent;