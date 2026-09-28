import { useEffect } from 'react';

const MiniGamePage = () => {
  useEffect(() => {
    window.location.replace('/mini-game/');
  }, []);

  return (
    <div role="status" style={{ padding: '2rem', textAlign: 'center' }}>
      최신 미니 게임을 불러오고 있습니다.
    </div>
  );
};

export default MiniGamePage;
