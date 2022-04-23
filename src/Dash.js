import { MediaPlayer } from "dashjs";
import { useEffect, useRef, useState } from "react";

export default function Dash({ url }) {
  const vidRef = useRef();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const player = MediaPlayer().create();
    player.initialize(vidRef.current, url, false);
    return () => {
      player.destroy();
    };
  }, [url]);

  const play = () => {
    const video = vidRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <video ref={vidRef} style={{ display: "none" }} />
      <button onClick={play}>{playing ? "||" : "Stream"}</button>
    </>
  );
}
