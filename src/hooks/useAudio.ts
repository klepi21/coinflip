export const useAudio = (url: string) => {
  const audio = typeof Audio !== 'undefined' ? new Audio(url) : null;
  
  const play = () => {
    if (audio) {
      audio.currentTime = 0; // Reset to start
      audio.play().catch(e => console.log('Audio play error:', e));
    }
  };

  return { play };
}; 