import * as React from "react"
import { useEffect, useState } from "react"
import { getMyVote, submitVote } from "./FirebaseREST"
import type { PartyVote } from "./FirebaseREST"
const emojiChoices = ["🎀", "🍼", "🐭", "🥰", "🎉", "💖", "🩵", "🩷", "🐣", "🌟", "🐻", "🦄"]
export default function VotePage() {
  const [nickname,setNickname]=useState("")
  const [emoji,setEmoji]=useState("🎀")
  const [choice,setChoice]=useState<"boy"|"girl"|null>(null)
  const [saved,setSaved]=useState<PartyVote|null>(null)
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  useEffect(()=>{let active=true; getMyVote().then(v=>{if(!active)return; if(v){setSaved(v);setNickname(v.nickname);setEmoji(v.emoji);setChoice(v.choice)}}).catch(e=>{if(active)setError(String(e?.message||e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[])
  async function send(){if(!nickname.trim()){setError("請先填寫暱稱");return}if(!choice){setError("請先選擇 BOY 或 GIRL");return}setBusy(true);setError("");try{await submitVote(saved?.nickname||nickname.trim(),saved?.emoji||emoji,choice);setSaved({uid:saved?.uid||"",nickname:saved?.nickname||nickname.trim(),emoji:saved?.emoji||emoji,choice})}catch(e:any){setError(String(e?.message||e))}finally{setBusy(false)}}
  return <main className="vote-screen"><div className="vote-card"><div className="eyebrow">WELCOME TO THE PARTY</div><div className="vote-decor">🩵 🎀 🩷</div><h1>BOY <span>or</span> GIRL?</h1><p>猜猜看，神秘主角是哪一隊？</p>{loading?<p>正在讀取你的投票…</p>:<><label className="field-label">你的暱稱</label><input maxLength={12} placeholder="輸入暱稱（最多12字）" value={nickname} disabled={!!saved} onChange={e=>setNickname(e.target.value)}/><label className="field-label">選一個 Emoji</label><div className="emoji-grid">{emojiChoices.map(e=><button type="button" key={e} disabled={!!saved} className={emoji===e?"selected":""} onClick={()=>setEmoji(e)}>{e}</button>)}</div><div className="teams"><button type="button" className={`team boy ${choice==="boy"?"active":""}`} onClick={()=>setChoice("boy")}>🩵<strong>TEAM BOY</strong><small>我猜是男生！</small></button><button type="button" className={`team girl ${choice==="girl"?"active":""}`} onClick={()=>setChoice("girl")}>🩷<strong>TEAM GIRL</strong><small>我猜是女生！</small></button></div><button className="submit" disabled={busy||!choice} onClick={send}>{busy?"送出中…":saved?"更新我的投票":"送出投票"}</button>{saved&&<p className="saved">已投票：{saved.emoji} {saved.nickname} · {saved.choice==="boy"?"TEAM BOY":"TEAM GIRL"}<br/>想改票？直接選另一隊，再按更新即可。</p>}</>}{error&&<p className="error" role="alert">{error}</p>}<a className="back" href="/">返回活動首頁</a></div></main>
}
