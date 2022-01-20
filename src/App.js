import { useState } from "react";
import "./styles.css";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [image, setImage] = useState(null);
  const [link, setLink] = useState("");
  const [blob, setBlob] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ fileName: "track.mp3", title: "track" });
  const [done, setDone] = useState([]);
  const [programTitle, setProgramTitle] = useState("");

  const reset = () => {
    setReady(false);
    setBlob(null);
  };
  const loadBlob = (url, fileName, title) => {
    const fetchMp3 = async () => {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = URL.createObjectURL(blob);
      setMeta({ title, fileName });
      setBlob(link);
      setReady(true);
      setLoading(false);
    };
    setLoading(true);
    fetchMp3();
  };

  const getPage = async () => {
    if (!link) {
      return;
    }
    setDone([]);
    setLoading(true);
    try {
      const res = await fetch(link);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const player = doc.querySelector(".mujRozhlasPlayer");
      const dataAttribute = player.getAttribute("data-player");

      const obj = JSON.parse(dataAttribute);
      const tracksTransformed = (obj?.data?.playlist || []).map((item) => {
        return {
          href: item.audioLinks[0].url,
          fileName: `${item.part.padStart(2, "0")}_${item.title
            .replaceAll(/[: .]+/g, "-")
            .toLowerCase()}`,
          title: item.title,
        };
      });

      const title = obj?.data?.series?.title;
      let altTitle = "";
      const content = doc.querySelector(".content");
      if (content) {
        const h1 = content.querySelector("h1");
        altTitle = h1.textContent;
      }

      setProgramTitle(title || altTitle || "");
      setImage(obj?.data?.poster?.src || null);
      setTracks(tracksTransformed);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Stahovadlo</h1>
      {loading && (
        <div className="overlay">
          <div className="content">
            <div className="content-card">
              <div>
                <img src="/skate.gif" alt="loading..." />
              </div>
              <div className="loading-text">Malý moment. Láduju to tam.</div>
            </div>
          </div>
        </div>
      )}
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          getPage();
        }}
      >
        <div>
          <input
            className="link"
            placeholder="Vlož odkaz z Rozhlasu"
            type="text"
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <button disabled={!link} type="submit" onClick={getPage}>
          Načíst
        </button>
      </form>
      {tracks.length > 0 && (
        <div className="program-title">
          <div className="title-wrapper">
            <h2>{programTitle}</h2>
          </div>
          <div className="preview">
            <img srcSet={image} alt="preview" />
          </div>
        </div>
      )}
      <div>
        {tracks.map((track, i) => (
          <div key={track.fileName}>
            <div className="item">
              <span>
                <b>{`[${i + 1}] `}</b>
                {track.title}{" "}
              </span>
              <button
                className="confirm"
                disabled={loading}
                onClick={() => {
                  loadBlob(track.href, track.fileName, track.title);
                  setDone((prev) => [...prev, i]);
                }}
              >
                {done.includes(i) ? "✓" : ">"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {ready && (
        <div className="overlay">
          <div className="content">
            <div className="content-card">
              <div className="close">
                <button onClick={reset}>✕</button>
              </div>
              <div>
                <div className="title">{meta.title}</div>
                <div>
                  <a
                    href={blob}
                    onClick={() => setReady(false)}
                    download={`${meta.fileName}.mp3`}
                  >
                    Uložit
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
