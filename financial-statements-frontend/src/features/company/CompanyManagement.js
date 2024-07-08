import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Text, Group, Paper, Container, Title, Alert, Progress, TextInput, Table } from '@mantine/core';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';
import { useInterval } from '@mantine/hooks';
import classes from './ButtonProgress.module.css';

function CompanyManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  const interval = useInterval(
    () =>
      setProgress((current) => {
        if (current < 100) {
          return current + 1;
        }
        interval.stop();
        setLoaded(true);
        return 0;
      }),
    20
  );

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '정보 없음';
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  const fetchLastUpdateTime = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies/last-update');
      setLastUpdateTime(response.data.last_update);
    } catch (err) {
      console.error('Error fetching last update time:', err);
      setError('최근 업데이트 시간을 불러오는데 실패했습니다.');
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies');
      if (Array.isArray(response.data)) {
        setCompanies(response.data);
        setFilteredCompanies(response.data);
      } else {
        console.error('Received data is not an array:', response.data);
        setCompanies([]);
        setFilteredCompanies([]);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('기업 목록을 불러오는데 실패했습니다.');
      setCompanies([]);
      setFilteredCompanies([]);
    }
  };

  useEffect(() => {
    fetchLastUpdateTime();
    fetchCompanies();
  }, []);

  useEffect(() => {
    const lowercasedValue = searchValue.toLowerCase().trim();
    if (lowercasedValue === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company => 
        company.corp_name.toLowerCase().includes(lowercasedValue) ||
        company.stock_code.toLowerCase().includes(lowercasedValue)
      );
      setFilteredCompanies(filtered);
    }
  }, [searchValue, companies]);

  const updateCompanies = async () => {
    if (loaded) {
      setLoaded(false);
      setProgress(0);
      return;
    }
    if (!interval.active) {
      interval.start();
      setIsLoading(true);
      setError(null);
      try {
        await axios.post('http://localhost:8000/api/v1/companies/update');
        await fetchLastUpdateTime();
        await fetchCompanies();
      } catch (err) {
        setError('회사 목록 업데이트에 실패했습니다.');
        console.error('Error updating companies:', err);
      }
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Paper shadow="xs" p="md" mt="xl">
        <Group position="apart" mb="md">
          <Title order={2}>기업 목록 관리</Title>
          <Group>
            <Button
              className={classes.button}
              onClick={updateCompanies}
              loading={isLoading}
              color={loaded ? 'teal' : 'blue'}
            >
              <div className={classes.label}>
                {progress !== 0 ? '업데이트 중...' : loaded ? '업데이트 완료' : '기업 목록 업데이트'}
              </div>
              {progress !== 0 && (
                <Progress
                  value={progress}
                  className={classes.progress}
                  color="rgba(51, 154, 240, 0.35)"
                  radius="sm"
                />
              )}
            </Button>
            <Text>최근 업데이트 일시: {formatDateTime(lastUpdateTime)}</Text>
          </Group>
        </Group>
        
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="오류!" color="red" mb="md">
            {error}
          </Alert>
        )}

        <TextInput
          placeholder="기업명 또는 종목코드 검색"
          mb="md"
          icon={<IconSearch size={14} />}
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
        />

        <Table>
          <thead>
            <tr>
              <th>기업명</th>
              <th>종목코드</th>
              <th>기업코드</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.slice(0, 10).map((company) => (
              <tr key={company.corp_code}>
                <td>{company.corp_name}</td>
                <td>{company.stock_code}</td>
                <td>{company.corp_code}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {filteredCompanies.length > 10 && (
          <Text size="sm" mt="xs" color="dimmed">
            총 {filteredCompanies.length}개 결과 중 10개 표시
          </Text>
        )}
      </Paper>
    </Container>
  );
}

export default CompanyManagement;