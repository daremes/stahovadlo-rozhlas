import { useState } from "react";
import "./styles.css";

// const lukyhoPlejlist = document.querySelector('.sm2-playlist-wrapper'); const odkazy = lukyhoPlejlist.querySelectorAll('a'); odkazy.forEach((odkaz) => {console.log(odkaz.getAttribute('href'))})

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

  console.log(done);
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
      const picture = doc.querySelector("picture > source");
      if (picture) {
        const img = picture.getAttribute("data-srcset");
        setImage(img || "");
      }
      const content = doc.querySelector(".content");
      if (content) {
        const h1 = content.querySelector("h1");
        const programTitle = h1.textContent;
        setProgramTitle(programTitle || "");
      }
      const playlist = doc.querySelector(".sm2-playlist-wrapper");
      if (playlist) {
        const tracks = Array.from(playlist.querySelectorAll("a"));
        const info = tracks.map((track, index) => {
          const href = track.getAttribute("href").split("?uuid=")[0];
          const title = track.querySelector("div > div").textContent;
          const fileName = `${String(index + 1).padStart(2, "0")}_${title
            .replaceAll(/[: .]+/g, "-")
            .toLowerCase()}`;
          return { href, fileName, title };
        });
        setTracks(info);
      } else {
        console.log("Nic!");
      }
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
