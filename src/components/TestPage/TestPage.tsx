import { greedyPois } from '@/src/constants/constants';
import { useEffect, useState } from 'react';

const TestPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);

  const fetchDataGreedy = async () => {
    setLoading(true);
    try {
      const response = await fetch('api/pois/find-route-greedy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(greedyPois),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result?.[0]?.route);
      setTotalDistance(result?.[0]?.totalDistance);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return data?.length ? (
    <div>
      <h1>{totalDistance}</h1>
      <ul>
        {data?.map?.((item, index) => (
          <ul key={0}>
            <li key={1}>{item.latitude}</li>
            <li key={2}>{item.longitude}</li>
          </ul>
        ))}
      </ul>
    </div>
  ) : (
    <button
      style={{
        backgroundColor: 'wheat',
        fontSize: '24px',
        padding: '10px',
        color: 'black',
        borderRadius: '10px',
        marginTop: '15px',
      }}
      onClick={() => fetchDataGreedy()}
    >
      Greedy
    </button>
  );
};

export default TestPage;
