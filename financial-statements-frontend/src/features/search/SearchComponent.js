import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, Button, Group, Text, Container, Paper, Loader } from '@mantine/core';

const SearchComponent = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [bsnsYear, setBsnsYear] = useState('');
  const [reprtCode, setReprtCode] = useState('');
  const [fsDiv, setFsDiv] = useState('OFS');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies');
      const companyOptions = response.data.map(company => ({
        value: company.corp_code,
        label: `${company.corp_name} (${company.stock_code})`
      }));
      setCompanies(companyOptions);
    } catch (err) {
      setError('기업 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedCompany || !bsnsYear || !reprtCode) {
      setError('모든 필드를 선택해주세요.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/financial-statements/${selectedCompany}`, {
        params: { bsns_year: bsnsYear, reprt_code: reprtCode, fs_div: fsDiv }
      });
      setResult(response.data);
    } catch (err) {
      setError('데이터를 불러오는 데 실패했습니다.');
      console.error('Error fetching financial statement:', err);
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const reprtCodeOptions = [
    { value: '11013', label: '1분기보고서' },
    { value: '11012', label: '반기보고서' },
    { value: '11014', label: '3분기보고서' },
    { value: '11011', label: '사업보고서' }
  ];

  const fsDivOptions = [
    { value: 'OFS', label: '재무제표' },
    { value: 'CFS', label: '연결재무제표' }
  ];

  return (
    <Container>
      <Paper shadow="xs" p="md">
        <h2>기업 재무제표 검색</h2>
        <Group grow>
          <Select
            label="기업"
            placeholder="기업을 선택하세요"
            data={companies}
            value={selectedCompany}
            onChange={setSelectedCompany}
            searchable
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
            data={fsDivOptions}
            value={fsDiv}
            onChange={setFsDiv}
          />
        </Group>
        <Button onClick={handleSearch} mt="md" fullWidth>검색</Button>

        {loading && <Loader mt="md" />}
        {error && <Text color="red" mt="md">{error}</Text>}

        {result && (
          <Paper mt="xl" p="md">
            <h3>검색 결과</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default SearchComponent;