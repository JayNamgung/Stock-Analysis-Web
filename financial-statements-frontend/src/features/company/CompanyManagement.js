import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Text, Group, Paper, Container, Title, Alert, Progress } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useInterval } from '@mantine/hooks';
import classes from './ButtonProgress.module.css';

function CompanyManagement() {
  const [setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

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

  useEffect(() => {
    fetchLastUpdateTime();
  }, []);

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
    }
  };

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
      </Paper>
    </Container>
  );
}

export default CompanyManagement;