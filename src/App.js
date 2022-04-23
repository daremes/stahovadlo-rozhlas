import { useState } from "react";
import Dash from "./Dash";
import "./styles.css";

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [image, setImage] = useState(null);
  const [link, setLink] = useState("");
  const [blob, setBlob] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({
    fileName: "track.mp3",
    title: "track",
    url: null,
  });
  const [done, setDone] = useState([]);
  const [programTitle, setProgramTitle] = useState("");
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const { loaded, total } = progress;

  const reset = () => {
    setReady(false);
    setBlob(null);
  };

  const loadBlob = (url, fileName, title) => {
    const fetchMp3 = async () => {
      const response = await fetch(url);
      const contentLength = response.headers.get("Content-Length");
      const total = Number(contentLength);
      let loaded = 0;
      const res = new Response(
        new ReadableStream({
          async start(controller) {
            const reader = response.body.getReader();
            while (true) {
              try {
                const { done, value } = await reader.read();
                if (done) break;
                loaded += value.byteLength;
                setProgress({ loaded, total });
                controller.enqueue(value);
              } catch (e) {
                controller.close();
                console.log("Neco se posralo");
              }
            }
            controller.close();
          },
        })
      );
      const blob = await res.blob();
      const link = URL.createObjectURL(blob);
      setMeta({ title, fileName, url });
      setBlob(link);
      setReady(true);
      setLoading(false);
    };
    setLoading(true);
    fetchMp3();
  };

  const getLegacy = async (doc) => {
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
        const titleV1 = track.querySelector("div > div")?.textContent;
        const titleV2 = track.textContent;
        const title = titleV1 || titleV2 || "Nevim?";
        const fileName = `${String(index + 1).padStart(2, "0")}_${title
          .replaceAll(/[: .]+/g, "-")
          .toLowerCase()}`;

        return { href, fileName, title };
      });
      setTracks(info);
    } else {
      console.log("Nic!");
    }
  };

  const handleMainPlayer = async (uuid) => {
    const BASE = "https://api.mujrozhlas.cz/episodes/";
    let playlistData = null;
    try {
      const res = await fetch(`${BASE}${uuid}`);
      playlistData = (await res.json()).data?.attributes;
    } catch (e) {
      console.log("prdlacky");
      setLoading(false);
      return;
    }

    if (!playlistData) {
      console.log("prdlacky");
      setLoading(false);
    }

    const title = playlistData.title || "track";
    const image = playlistData.asset?.url || null;

    const tracks = playlistData.audioLinks.map((track, index) => {
      return {
        href: track.url,
        title,
        fileName: `${String(index + 1).padStart(2, "0")}_${title
          .replaceAll(/[: .]+/g, "-")
          .toLowerCase()}`,
      };
    });

    setProgramTitle(title);
    setImage(image);
    setTracks(tracks);
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

      const playerV1 = doc.querySelector(".mujRozhlasPlayer");
      const playerV2 = doc.querySelector("section.player-wrapper");
      const player = playerV1 || playerV2;

      if (!player) {
        getLegacy(doc);
        return;
      }
      const dataAttributeV1 = player.getAttribute("data-player");
      const dataAttributeV2 = player.getAttribute("data-entry");
      const dataAttribute = dataAttributeV1 || dataAttributeV2;

      const obj = JSON.parse(dataAttribute);

      if (obj.uuid && dataAttributeV2) {
        handleMainPlayer(obj.uuid);
        return;
      }

      const tracksTransformed = (obj?.data?.playlist || []).map((item) => {
        return {
          href: item.audioLinks[0]?.url,
          fileName: `${String(item.part).padStart(2, "0")}_${item.title
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
  console.log(tracks);
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
              <div
                style={{
                  width: 200,
                  height: 16,
                  border: "1px solid #000",
                  margin: 8,
                }}
              >
                <div
                  style={{
                    width: `${(loaded / total) * 100}%`,
                    height: 16,
                    background: "#000",
                  }}
                />
              </div>
              <div className="loading-text">Malý moment. Láduju to tam.</div>
              <div style={{ margin: 8, fontWeight: "lighter", fontSize: 10 }}>
                {formatBytes(loaded)}/{formatBytes(total)}
              </div>
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
        <button type="submit" disabled={!link}>
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
                style={{ color: done.includes(i) ? "#21B6A8" : "#000" }}
                onClick={() => {
                  loadBlob(track.href, track.fileName, track.title);
                  setDone((prev) => [...prev, i]);
                }}
              >
                {done.includes(i) ? "✓" : ">"}
              </button>
              {track.href?.includes(".mpd") && (
                <div>
                  <Dash url={track.href} />
                </div>
              )}
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
