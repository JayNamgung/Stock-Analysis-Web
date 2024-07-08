import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Autocomplete, Select, Button, Group, Text, Container, Paper, Loader } from '@mantine/core';

const SearchComponent = React.memo(() => {
  const [companyName, setCompanyName] = useState('');
  const [corpCode, setCorpCode] = useState('');
  const [bsnsYear, setBsnsYear] = useState('');
  const [reprtCode, setReprtCode] = useState('');
  const [fsDiv, setFsDiv] = useState('OFS');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const reprtCodeOptions = useMemo(() => [
    { value: '11013', label: '1분기보고서' },
    { value: '11012', label: '반기보고서' },
    { value: '11014', label: '3분기보고서' },
    { value: '11011', label: '사업보고서' }
  ], []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const year = currentYear - i;
      return { value: year.toString(), label: year.toString() };
    });
  }, []);

  const transformCompanyData = useCallback((companies) => {
    return companies
      .filter(company => company && company.corp_name && company.stock_code)
      .map(company => ({
        value: company.stock_code,
        label: company.corp_name
      }));
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies');
      if (Array.isArray(response.data) && response.data.length > 0) {
        const options = transformCompanyData(response.data);
        setCompanyOptions(options);
      } else {
        setCompanyOptions([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('기업 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [transformCompanyData]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  useEffect(() => {
    console.log('companyOptions:', companyOptions);
  }, [companyOptions]);

  const handleCompanyChange = useCallback((value) => {
    setCompanyName(value);
    const selectedCompany = companyOptions.find(company => company.label === value);
    setCorpCode(selectedCompany ? selectedCompany.value : '');
  }, [companyOptions]);

  const handleSearch = useCallback(async () => {
    if (!corpCode || !bsnsYear || !reprtCode) {
      setError('모든 필드를 선택해주세요.');
      return;
    }
    setError('');
    setResult(null);
    try {
      const url = `http://localhost:8000/api/v1/financial-statements/${corpCode}`;
      const response = await axios.get(url, {
        params: { bsns_year: bsnsYear, reprt_code: reprtCode, fs_div: fsDiv }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Error details:', err.response ? err.response.data : err.message);
      setError('데이터를 불러오는 데 실패했습니다. 입력 값을 확인해주세요.');
    }
  }, [corpCode, bsnsYear, reprtCode, fsDiv]);

  const filterCompanies = (value, item) => {
    if (!item || !item.label) {
      return false;
    }
    return item.label.toLowerCase().includes(value.toLowerCase().trim());
  };

  return (
    <Container>
      <Paper shadow="xs" p="md">
        <h2>기업 재무제표 검색</h2>
        <Group grow>
          {isLoading ? (
            <Loader />
          ) : (
            <Autocomplete
              label="기업명"
              placeholder="기업명을 입력하세요"
              data={companyOptions}
              value={companyName}
              onChange={handleCompanyChange}
              filter={filterCompanies}
              nothingFound="검색 결과가 없습니다"
            />
          )}
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
});

export default SearchComponent;