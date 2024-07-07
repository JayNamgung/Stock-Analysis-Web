import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Table, Text, Group, Paper, Container, Title, Alert } from '@mantine/core';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/api/v1/companies');
      setCompanies(response.data);
    } catch (err) {
      setError('회사 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching companies:', err);
    }
    setIsLoading(false);
  };

  const updateCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8000/api/v1/companies/update');
      alert(response.data.message);
      fetchCompanies();
    } catch (err) {
      setError('회사 목록 업데이트에 실패했습니다.');
      console.error('Error updating companies:', err);
    }
    setIsLoading(false);
  };

  const rows = companies.map((company) => (
    <tr key={company.corp_code}>
      <td>{company.corp_code}</td>
      <td>{company.corp_name}</td>
      <td>{company.stock_code}</td>
    </tr>
  ));

  return (
    <Container>
      <Paper shadow="xs" p="md" mt="xl">
        <Group position="apart" mb="md">
          <Title order={2}>회사 관리</Title>
          <Button
            onClick={updateCompanies}
            loading={isLoading}
            leftIcon={<IconRefresh size={14} />}
            color="blue"
          >
            회사 목록 업데이트
          </Button>
        </Group>
        
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="오류!" color="red" mb="md">
            {error}
          </Alert>
        )}

        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>회사 코드</th>
              <th>회사명</th>
              <th>주식 코드</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3}>
                  <Text align="center">로딩 중...</Text>
                </td>
              </tr>
            ) : rows}
          </tbody>
        </Table>
      </Paper>
    </Container>
  );
}

export default CompanyManagement;