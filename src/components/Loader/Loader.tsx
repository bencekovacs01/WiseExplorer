import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';

interface LoaderProps {
  loading: boolean;
}

const Loader: React.FC<LoaderProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <LinearProgress
      style={{
        width: '100%',
        height: '6px',
        position: 'fixed',
        zIndex: 1000,
      }}
    />
  );
};

export default Loader;
