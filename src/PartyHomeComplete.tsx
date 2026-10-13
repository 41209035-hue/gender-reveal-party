import * as React from "react"
import { useEffect, useState } from "react"
import { getVotes } from "./FirebaseREST"
import type { PartyVote } from "./FirebaseREST"

/**
 * Put images in public/photos/. Match filenames (including extensions) below.
 * Optional custom QR image: public/photos/qrcode.png
 * Leave QR_IMAGE empty to generate a QR automatically for this site's /vote URL.
 */
const PHOTOS = {
    height167: "/photos/height167.jpg",
    height173: "/photos/height173.jpg",
    mousePhoto: "/photos/mouse.jpg",
    partialPhoto: "/photos/partial.jpg",
    engineerPhoto: "/photos/engineer.jpg",
}
const QR_IMAGE = "" // Example: "/photos/qrcode.png"

const BLUE = "#78BFF1"
const PINK = "#F2A1C8"
const INK = "#493C57"
const CARD: React.CSSProperties = {
    background: "rgba(255,255,255,.88)",
    border: "1px solid rgba(255,255,255,.9)",
    borderRadius: 28,
    boxShadow: "0 12px 40px rgba(85,65,110,.07)",
    padding: "clamp(22px,4vw,42px)",
}

function Picture({ src, label, height = 320 }: { src: string; label: string; height?: number }) {
    const [failed, setFailed] = useState(false)
    useEffect(() => setFailed(false), [src])
    return (
        <div style={{ height, borderRadius: 22, overflow: "hidden", position: "relative", background: "linear-gradient(145deg,#F6E8F1,#E6F2FF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {src && !failed ? (
                <img src={src} alt={label} onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
                <div style={{ textAlign: "center", color: "#927D9A", padding: 24 }}>
                    <div style={{ fontSize: 42, marginBottom: 12 }}>📷</div>
                    <div style={{ fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>請確認 public/photos 的圖片檔名與副檔名</div>
                </div>
            )}
        </div>
    )
}

function Results({ votes, error, caption }: { votes: PartyVote[]; error: string; caption: string }) {
    const boys = votes.filter(v => v.choice === "boy")
    const girls = votes.filter(v => v.choice === "girl")
    const total = boys.length + girls.length
    const bp = total ? boys.length / total * 100 : 0
    const gp = total ? girls.length / total * 100 : 0
    return (
        <div style={{ ...CARD, margin: "24px 0", padding: "clamp(18px,3vw,30px)" }}>
            <div style={{ textAlign: "center", fontSize: 12, letterSpacing: 2, fontWeight: 800, color: "#9B85A3" }}>LIVE VOTING</div>
            <h3 style={{ textAlign: "center", margin: "8px 0 18px", fontSize: "clamp(18px,2.5vw,26px)" }}>{caption}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
                {([{ label: "🩵 TEAM BOY", count: boys.length, pct: bp, color: BLUE }, { label: "🩷 TEAM GIRL", count: girls.length, pct: gp, color: PINK }] as const).map(t => (
                    <div key={t.label} style={{ borderRadius: 18, padding: 18, textAlign: "center", background: t.color + "26" }}>
                        <div style={{ fontSize: "clamp(13px,2vw,22px)", fontWeight: 850 }}>{t.label}</div>
                        <div style={{ fontSize: "clamp(30px,5vw,55px)", fontWeight: 900 }}>{total ? Math.round(t.pct) + "%" : "—"}</div>
                        <div style={{ fontSize: 14 }}>{t.count} 票</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", height: 18, borderRadius: 999, overflow: "hidden", background: "#EDE8F0", margin: "16px 0" }}>
                <div style={{ width: bp + "%", background: BLUE, transition: "width .5s" }} />
                <div style={{ width: gp + "%", background: PINK, transition: "width .5s" }} />
            </div>
            <div style={{ textAlign: "center", fontSize: 13, color: "#887B90", marginBottom: 14 }}>目前共 {total} 人投票 · 每 2 秒更新</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
                {([{ people: boys, color: BLUE }, { people: girls, color: PINK }] as const).map((team, i) => (
                    <div key={i} style={{ minWidth: 0, display: "flex", gap: 7, flexWrap: "wrap", alignContent: "flex-start" }}>
                        {team.people.length === 0 ? <span style={{ fontSize: 13, color: "#AAA" }}>尚無隊員</span> : team.people.map((p, j) => (
                            <span key={p.uid || j} style={{ borderRadius: 999, background: team.color + "22", padding: "7px 10px", fontSize: 14, overflowWrap: "anywhere" }}>{p.emoji} {p.nickname}</span>
                        ))}
                    </div>
                ))}
            </div>
            {error && <div style={{ color: "#B33", fontSize: 13, marginTop: 12 }}>同步失敗：{error}</div>}
        </div>
    )
}

function Clue({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
    return (
        <section style={{ minHeight: "70vh", display: "flex", alignItems: "center", padding: "36px 0" }}>
            <div style={{ ...CARD, width: "100%", boxSizing: "border-box" }}>
                <div style={{ color: "#B47FA3", fontWeight: 900, letterSpacing: 3, fontSize: 13 }}>CLUE {number}</div>
                <h2 style={{ fontSize: "clamp(28px,4.4vw,52px)", margin: "12px 0 26px", lineHeight: 1.2 }}>{title}</h2>
                {children}
            </div>
        </section>
    )
}

export default function PartyHomeComplete() {
    const [votes, setVotes] = useState<PartyVote[]>([])
    const [error, setError] = useState("")
    const [voteUrl, setVoteUrl] = useState("")
    useEffect(() => {
        // Avoid reading window during server-side rendering.
        setVoteUrl(`${window.location.origin}/vote`)
    }, [])
    useEffect(() => {
        let mounted = true
        let busy = false
        const poll = async () => {
            if (busy) return
            busy = true
            try {
                const list = await getVotes()
                if (mounted) { setVotes(list); setError("") }
            } catch (e: any) {
                if (mounted) setError(String(e?.message || e))
            } finally { busy = false }
        }
        poll()
        const id = window.setInterval(poll, 2000)
        return () => { mounted = false; window.clearInterval(id) }
    }, [])
    const result = (caption: string) => <Results votes={votes} error={error} caption={caption} />
    const qrSrc = QR_IMAGE || (voteUrl ? "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=14&data=" + encodeURIComponent(voteUrl) : "")
    return (
        <main style={{ boxSizing: "border-box", width: "100%", minHeight: "100vh", background: "linear-gradient(125deg,#FFF4F8 0%,#F8F2FF 48%,#ECF7FF 100%)", fontFamily: "Inter, Noto Sans TC, system-ui, sans-serif", color: INK, padding: "0 clamp(16px,4vw,60px) 60px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <section style={{ minHeight: "86vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ ...CARD, width: "100%", boxSizing: "border-box", padding: "clamp(35px,6vw,80px) 24px" }}>
                        <div style={{ fontSize: 50 }}>🩵 🎀 🩷</div>
                        <div style={{ letterSpacing: 4, fontSize: 13, fontWeight: 900, color: "#B77C9E", marginTop: 18 }}>WELCOME TO THE PARTY</div>
                        <h1 style={{ fontSize: "clamp(36px,7vw,84px)", lineHeight: 1.1, margin: "18px 0" }}>BOY <span style={{ color: PINK }}>or</span> GIRL?</h1>
                        <p style={{ fontSize: "clamp(16px,2.4vw,24px)", lineHeight: 1.8 }}>五個線索，一個神秘答案。<br />準備好加入猜測了嗎？</p>
                        <div style={{ fontSize: 38, marginTop: 20 }}>✨ 🐭 ✨</div>
                    </div>
                </section>
                <section style={{ ...CARD, textAlign: "center", margin: "20px 0 34px" }}>
                    <div style={{ fontSize: 13, letterSpacing: 3, color: "#B47FA3", fontWeight: 800 }}>JOIN THE GAME</div>
                    <h2 style={{ fontSize: "clamp(25px,4vw,42px)", margin: "12px 0" }}>掃描 QR Code，加入投票！</h2>
                    <p style={{ color: "#8B7F91" }}>選擇暱稱和 Emoji，投下你的 BOY／GIRL 猜測，隨時都可以改票。</p>
                    {qrSrc ? <><img alt="投票 QR Code" src={qrSrc} style={{ width: "min(240px,80%)", height: "auto", margin: "14px auto", borderRadius: 12 }} />{voteUrl && <div><a href={voteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#8D5A9B", overflowWrap: "anywhere" }}>點我前往手機投票</a></div>}</> : <p>正在產生投票 QR Code…</p>}
                </section>
                {result("猜猜看，現在誰領先？")}
                <Clue number="01" title="身高的秘密 📏">
                    <p style={{ fontSize: 18 }}>167 cm，還是 173 cm？光看身高，你猜得出來嗎？</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
                        <div><Picture src={PHOTOS.height167} label="167 CM 偶像照片" /><div style={{ textAlign: "center", fontWeight: 900, fontSize: 25, marginTop: 12, color: "#5DABE2" }}>167 CM</div></div>
                        <div><Picture src={PHOTOS.height173} label="173 CM 偶像照片" /><div style={{ textAlign: "center", fontWeight: 900, fontSize: 25, marginTop: 12, color: "#D879AB" }}>173 CM</div></div>
                    </div>
                </Clue>
                {result("第一個線索公開後，你改變想法了嗎？")}
                <Clue number="02" title="交友軟體暱稱：丫鼠 🐭">
                    <p style={{ fontSize: 20 }}>如果你在交友軟體上遇到一個叫「丫鼠」的人……你會猜 TA 是男生還是女生？</p>
                    <Picture src={PHOTOS.mousePhoto} label="丫鼠／老鼠照片" height={370} />
                </Clue>
                {result("丫鼠到底是哪一隊？")}
                <Clue number="03" title="名字裡有個「惟」 ✨">
                    <p style={{ fontSize: 19 }}>同樣讀作「ㄨㄟˊ」的字，哪一個讓你最有感覺？</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 24 }}>
                        {["惟", "唯", "維", "薇", "瑋", "韋", "圍", "微"].map((word, i) => <div key={word} style={{ borderRadius: 20, padding: "clamp(12px,3vw,28px) 5px", textAlign: "center", background: i === 0 ? "#F7D6E8" : i % 2 ? "#E5F2FD" : "#F2EAF9", fontSize: "clamp(29px,5vw,64px)", fontWeight: 900 }}>{word}</div>)}
                    </div>
                    <p style={{ textAlign: "center", color: "#8C7C95" }}>一個字，能透露多少秘密？</p>
                </Clue>
                {result("看完名字線索，現在的票數是？")}
                <Clue number="04" title="神秘局部特寫 🔍">
                    <p style={{ fontSize: 19 }}>只給你看一小部分，能猜出這個人是誰嗎？</p>
                    <Picture src={PHOTOS.partialPhoto} label="神秘局部特寫照片" height={430} />
                </Clue>
                {result("線索越來越明顯了嗎？")}
                <Clue number="05" title="職業：機電工程師 ⚙️">
                    <p style={{ fontSize: 19 }}>最後一個提示：TA 的工作是機電工程師。</p>
                    <Picture src={PHOTOS.engineerPhoto} label="機電工程師工作照片" height={430} />
                    <p style={{ textAlign: "center", fontWeight: 800, fontSize: 22, marginTop: 24 }}>這個職業，會改變你的答案嗎？</p>
                </Clue>
                {result("最終猜測 · TEAM BOY 還是 TEAM GIRL？")}
                <section style={{ ...CARD, textAlign: "center", marginTop: 36 }}>
                    <div style={{ fontSize: 45 }}>🩵 🎉 🩷</div>
                    <h2 style={{ fontSize: "clamp(28px,4vw,48px)", margin: "14px 0" }}>請鎖定你的答案！</h2>
                    <p style={{ fontSize: 19, color: "#8E7B97" }}>謎底即將揭曉……</p>
                </section>
            </div>
        </main>
    )
}
