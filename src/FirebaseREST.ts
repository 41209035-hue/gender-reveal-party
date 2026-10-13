const API_KEY = "AIzaSyCXdcKt9WL2Z2rmcRxOhUuTFbIyQLyUDws"
const PROJECT_ID = "gender-reveal-party-55ec0"
// 五個線索共用同一份投票資料
const VOTES_PATH = "events/party/stages/initial/votes"
const AUTH_STORAGE_KEY = "gender_party_firebase_auth"
type Session = {
    uid: string
    idToken: string
    refreshToken: string
    expiresAt: number
}
export type PartyVote = {
    uid: string
    nickname: string
    emoji: string
    choice: "boy" | "girl"
}
async function requestJSON(url: string, options: RequestInit = {}) {
    const response = await fetch(url, options)
    const data = await response.json()
    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
                `Firebase request failed (${response.status})`
        )
    }
    return data
}
function saveSession(session: Session) {
    if (typeof window === "undefined") return session
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    return session
}
let sessionPromise: Promise<Session> | null = null
async function loadSession(): Promise<Session> {
    let existing: Session | null = null
    if (typeof window !== "undefined") {
        try {
            const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
            if (stored) existing = JSON.parse(stored)
        } catch {
            window.localStorage.removeItem(AUTH_STORAGE_KEY)
        }
    }
    // 已登入且權杖尚未過期
    if (existing?.idToken && existing.expiresAt > Date.now() + 60000) {
        return existing
    }
    // 使用 refresh token 恢復原本的匿名身分
    if (existing?.refreshToken) {
        const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: existing.refreshToken,
        })
        const refreshed = await requestJSON(
            `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            }
        )
        return saveSession({
            uid: refreshed.user_id,
            idToken: refreshed.id_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: Date.now() + Number(refreshed.expires_in) * 1000,
        })
    }
    // 第一次進入：自動建立 Firebase 匿名身分
    const created = await requestJSON(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ returnSecureToken: true }),
        }
    )
    return saveSession({
        uid: created.localId,
        idToken: created.idToken,
        refreshToken: created.refreshToken,
        expiresAt: Date.now() + Number(created.expiresIn) * 1000,
    })
}
export function getSession(): Promise<Session> {
    if (!sessionPromise) {
        sessionPromise = loadSession().catch((error) => {
            sessionPromise = null
            throw error
        })
    }
    return sessionPromise
}
const firestoreBase =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents`
function toVote(document: any): PartyVote {
    const fields = document.fields || {}
    return {
        uid: fields.uid?.stringValue || "",
        nickname: fields.nickname?.stringValue || "",
        emoji: fields.emoji?.stringValue || "🎉",
        choice: fields.choice?.stringValue === "girl" ? "girl" : "boy",
    }
}
// 讀取所有人的投票
export async function getVotes(): Promise<PartyVote[]> {
    const session = await getSession()
    const votes: PartyVote[] = []
    let pageToken = ""
    do {
        const params = new URLSearchParams({
            pageSize: "300",
        })
        if (pageToken) params.set("pageToken", pageToken)
        const data = await requestJSON(`${firestoreBase}/${VOTES_PATH}?${params}`, {
            headers: {
                Authorization: `Bearer ${session.idToken}`,
            },
        })
        votes.push(...(data.documents || []).map(toVote))
        pageToken = data.nextPageToken || ""
    } while (pageToken)
    return votes
}
// 新增或修改自己的投票
export async function submitVote(
    nickname: string,
    emoji: string,
    choice: "boy" | "girl"
): Promise<void> {
    const session = await getSession()
    const documentName =
        `projects/${PROJECT_ID}/databases/(default)/documents/` +
        `${VOTES_PATH}/${session.uid}`
    await requestJSON(`${firestoreBase}:commit`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.idToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            writes: [
                {
                    update: {
                        name: documentName,
                        fields: {
                            uid: {
                                stringValue: session.uid,
                            },
                            nickname: {
                                stringValue: nickname,
                            },
                            emoji: {
                                stringValue: emoji,
                            },
                            choice: {
                                stringValue: choice,
                            },
                        },
                    },
                    updateTransforms: [
                        {
                            fieldPath: "votedAt",
                            setToServerValue: "REQUEST_TIME",
                        },
                    ],
                },
            ],
        }),
    })
}
export async function getMyVote(): Promise<PartyVote | null> {
    const session = await getSession()
    try {
        const document = await requestJSON(`${firestoreBase}/${VOTES_PATH}/${session.uid}`, {
            headers: {
                Authorization: `Bearer ${session.idToken}`,
            },
        })
        return toVote(document)
    } catch (error: any) {
        if (String(error.message).includes("NOT_FOUND")) {
            return null
        }
        throw error
    }
}
