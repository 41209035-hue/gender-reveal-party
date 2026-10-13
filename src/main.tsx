import * as React from "react"
import { createRoot } from "react-dom/client"
import PartyHomeComplete from "./PartyHomeComplete"
import VotePage from "./VotePage"
import "./style.css"
const isVote = window.location.pathname.replace(/\/$/, "") === "/vote"
createRoot(document.getElementById("root")!).render(<React.StrictMode>{isVote ? <VotePage/> : <PartyHomeComplete/>}</React.StrictMode>)
