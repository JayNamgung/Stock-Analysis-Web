import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Autocomplete, Select, Button, Group, Text, Container, Paper } from '@mantine/core';

function SearchComponent() {
  const [companyName, setCompanyName] = useState('');
  const [corpCode, setCorpCode] = useState('');
  const [bsnsYear, setBsnsYear] = useState('');
  const [reprtCode, setReprtCode] = useState('');
  const [fsDiv, setFsDiv] = useState('OFS');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]); // 초기값을 빈 배열로 설정

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
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies');
      console.log('API response:', response.data); // 응답 데이터 로깅
      if (Array.isArray(response.data) && response.data.length > 0) {
        const options = response.data.map(company => ({
          value: company.corp_code,
          label: company.corp_name
        }));
        setCompanyOptions(options);
      } else {
        console.error('Unexpected API response format:', response.data);
        setCompanyOptions([]); // 빈 배열로 설정
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanyOptions([]); // 오류 시 빈 배열로 설정
    }
  };

  const handleCompanyChange = (value) => {
    setCompanyName(value);
    const selectedCompany = companyOptions.find(company => company.label === value);
    if (selectedCompany) {
      setCorpCode(selectedCompany.value);
    } else {
      setCorpCode('');
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
      const url = `http://localhost:8000/api/v1/financial-statements/${corpCode}`;
      const response = await axios.get(url, {
        params: {
          bsns_year: bsnsYear,
          reprt_code: reprtCode,
          fs_div: fsDiv
        }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Error details:', err.response ? err.response.data : err.message);
      setError('데이터를 불러오는 데 실패했습니다. 입력 값을 확인해주세요.');
    }
  };

  return (
    <Container>
      <Paper shadow="xs" p="md">
        <h2>기업 재무제표 검색</h2>
        <Group grow>
          <Autocomplete
            label="기업명"
            placeholder="기업명을 입력하세요"
            data={Array.isArray(companyOptions) ? companyOptions : []}
            value={companyName}
            onChange={handleCompanyChange}
            filter={(value, item) => {
              if (!item || !item.label) return false;
              return item.label.toLowerCase().includes(value.toLowerCase().trim());
            }}
            nothingFound="검색 결과가 없습니다"
          />
          <Select
            label="사업연도"
            placeholder="사업연도 선택"
            data={yearOptions}
            value={bsnsYear}
            onChange={setBsnsYear}
          />
          <Select
            label="보고서 종류"
            placeholder="보고서 선택"
            data={reprtCodeOptions}
            value={reprtCode}
            onChange={setReprtCode}
          />
          <Select
            label="재무제표 구분"
            placeholder="재무제표 구분 선택"
            data={[
              { value: 'OFS', label: '개별' },
              { value: 'CFS', label: '연결' }
            ]}
            value={fsDiv}
            onChange={setFsDiv}
          />
        </Group>
        <Button onClick={handleSearch} mt="md" fullWidth>검색</Button>

        {error && <Text color="red" mt="md">{error}</Text>}

        {result && (
          <Paper mt="xl" p="md">
            <h3>{result.corp_name} 재무제표</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Paper>
        )}
      </Paper>
    </Container>
  );
}

export default SearchComponent;