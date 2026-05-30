import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  child,
  set,
  update,
  onValue,
  get,
  remove,
  query,
  orderByChild,
  endAt,
  limitToLast,
  push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
const firebaseConfig = {
  apiKey: "AIzaSyAycT0fkOYGT59qutLaBjxOTq9ZILNDTL4",
  authDomain: "online-gvs.firebaseapp.com",
  databaseURL: "https://online-gvs-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "online-gvs",
  storageBucket: "online-gvs.firebasestorage.app",
  messagingSenderId: "415823310946",
  appId: "1:415823310946:web:91c174ec6e585b9c70613b",
  measurementId: "G-F6RJ07D98Z"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function createRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export function getRoomRef(roomId) {
  return ref(db, `rooms/${roomId}`);
}

export function getRoomsRef() {
  return ref(db, "rooms");
}

export function writeRoom(roomId, data) {
  return set(getRoomRef(roomId), data);
}

export function updateRoom(roomId, patch) {
  return update(getRoomRef(roomId), patch);
}

export function readRoom(roomId) {
  return get(getRoomRef(roomId));
}

export function removeRoom(roomId) {
  return remove(getRoomRef(roomId));
}

export function listenRoom(roomId, callback) {
  return onValue(getRoomRef(roomId), snapshot => {
    callback(snapshot.val());
  });
}

export async function cleanupOldRooms(maxAgeMs = 24 * 60 * 60 * 1000) {
  const border = Date.now() - maxAgeMs;
  const oldRoomsQuery = query(
    getRoomsRef(),
    orderByChild("meta/updatedAt"),
    endAt(border)
  );

  const snapshot = await get(oldRoomsQuery);
  if (!snapshot.exists()) {
    return 0;
  }

  const removals = [];
  snapshot.forEach(child => {
    removals.push(remove(child.ref));
  });

  await Promise.all(removals);
  return removals.length;
}

export async function readSpectatableRooms(limit = 20) {
  const roomsQuery = query(
    getRoomsRef(),
    orderByChild("meta/updatedAt"),
    limitToLast(limit)
  );

  const snapshot = await get(roomsQuery);
  if (!snapshot.exists()) {
    return [];
  }

  const rooms = [];

  snapshot.forEach(childSnap => {
    const roomId = childSnap.key;
    const roomData = childSnap.val();

    if (!roomData) return;

    const status = roomData.meta?.status || "waiting";
    const mode = roomData.meta?.mode || "";
    const playerA = roomData.players?.A || {};
    const playerB = roomData.players?.B || {};

    const isBattleRoom =
      mode === "online1v1" &&
      status !== "finished" &&
      status !== "peace" &&
      playerA.joined &&
      playerB.joined &&
      playerA.unitId &&
      playerB.unitId &&
      playerA.ready &&
      playerB.ready;

    const spectatorPolicy = roomData.spectatorSettings?.policy || "allow";

    if (!isBattleRoom) return;
    if (spectatorPolicy === "deny") return;

    rooms.push({
      roomId,
      roomData,
      updatedAt: Number(roomData.meta?.updatedAt || 0)
    });
  });

  rooms.sort((a, b) => b.updatedAt - a.updatedAt);

  return rooms;
}

export function buildInitialRoomData({ mode = "online1v1" } = {}) {
  const now = Date.now();

  return {
    meta: {
      status: "waiting",
      mode,
      hostPlayer: "A",
      createdAt: now,
      updatedAt: now,
      result: null,
      notice: ""
    },
    players: {
      A: {
        joined: true,
        ready: false,
        unitId: null,
        left: false,
        lastSeen: now,
        profileId: null,
        profileName: null,
        equippedTitles: []
      },
      B: {
        joined: false,
        ready: false,
        unitId: null,
        left: false,
        lastSeen: null,
        profileId: null,
        profileName: null,
        equippedTitles: []
      }
    },
    chat: {
      A: {
        text: "",
        updatedAt: 0
      },
      B: {
        text: "",
        updatedAt: 0
      }
    },
    peace: {
      requestedBy: null,
      status: "none",
      updatedAt: 0
    },
    spectatorSettings: {
      policy: "allow",
      updatedAt: now
    },
    spectators: {},
    spectatorChat: {
      latest: null
    },
    battle: null,
    action: {
      actionId: 0,
      actor: "A",
      type: "roomCreated",
      payload: {},
      createdAt: now
    }
  };
}

export function getPlayerProfileRef(playerId) {
  return ref(db, `players/${playerId}`);
}

export async function readPlayerProfile(playerId) {
  const snapshot = await get(getPlayerProfileRef(playerId));
  return snapshot.exists() ? snapshot.val() : null;
}

export function writePlayerProfile(playerId, data) {
  return set(getPlayerProfileRef(playerId), data);
}

export function updatePlayerProfile(playerId, patch) {
  return update(getPlayerProfileRef(playerId), patch);
}
export function getPlayerProfilesRef() {
  return ref(db, "players");
}

export async function readPlayerProfiles() {
  const snapshot = await get(getPlayerProfilesRef());
  return snapshot.exists() ? snapshot.val() : {};
}
export function getRandomMatchAnnouncementRef() {
  return ref(db, "randomMatch/announcements/current");
}

export function writeRandomMatchAnnouncement(data) {
  return set(getRandomMatchAnnouncementRef(), data);
}



export function listenRandomMatchAnnouncement(callback) {
  return onValue(getRandomMatchAnnouncementRef(), snapshot => {
    callback(snapshot.val());
  });
}
export function getRandomMatchWaitingRef(ticketId = null) {
  return ticketId
    ? ref(db, `randomMatch/waiting/${ticketId}`)
    : ref(db, "randomMatch/waiting");
}

export function getRandomMatchSessionRef(sessionId) {
  return ref(db, `randomMatch/sessions/${sessionId}`);
}

export function writeRandomMatchWaiting(ticketId, data) {
  return set(getRandomMatchWaitingRef(ticketId), data);
}

export function updateRandomMatchWaiting(ticketId, patch) {
  return update(getRandomMatchWaitingRef(ticketId), patch);
}

export function removeRandomMatchWaiting(ticketId) {
  return remove(getRandomMatchWaitingRef(ticketId));
}

export function readRandomMatchWaiting() {
  return get(getRandomMatchWaitingRef());
}

export function listenRandomMatchWaiting(ticketId, callback) {
  return onValue(getRandomMatchWaitingRef(ticketId), snapshot => {
    callback(snapshot.val());
  });
}

export function writeRandomMatchSession(sessionId, data) {
  return set(getRandomMatchSessionRef(sessionId), data);
}

export function updateRandomMatchSession(sessionId, patch) {
  return update(getRandomMatchSessionRef(sessionId), patch);
}

export function readRandomMatchSession(sessionId) {
  return get(getRandomMatchSessionRef(sessionId));
}

export function listenRandomMatchSession(sessionId, callback) {
  return onValue(getRandomMatchSessionRef(sessionId), snapshot => {
    callback(snapshot.val());
  });
}

export function removeRandomMatchSession(sessionId) {
  return remove(getRandomMatchSessionRef(sessionId));
}

export async function cleanupOldRandomMatch(maxAgeMs = 10 * 60 * 1000) {
  const border = Date.now() - maxAgeMs;
  let count = 0;

  const waitingSnapshot = await get(getRandomMatchWaitingRef());
  if (waitingSnapshot.exists()) {
    const removals = [];
    waitingSnapshot.forEach(childSnap => {
      const data = childSnap.val();
      const updatedAt = Number(data?.updatedAt || data?.createdAt || 0);
      if (updatedAt && updatedAt < border) {
        removals.push(remove(childSnap.ref));
      }
    });
    await Promise.all(removals);
    count += removals.length;
  }

  const sessionsSnapshot = await get(ref(db, "randomMatch/sessions"));
  if (sessionsSnapshot.exists()) {
    const removals = [];
    sessionsSnapshot.forEach(childSnap => {
      const data = childSnap.val();
      const updatedAt = Number(data?.updatedAt || data?.createdAt || 0);
      if (updatedAt && updatedAt < border) {
        removals.push(remove(childSnap.ref));
      }
    });
    await Promise.all(removals);
    count += removals.length;
  }

  return count;
}
export function getFeedbackRef(feedbackId = null) {
  return feedbackId
    ? ref(db, `feedback/${feedbackId}`)
    : ref(db, "feedback");
}

export function submitFeedback(data) {
  return push(getFeedbackRef(), data);
}

export async function readFeedbackList(limit = 100) {
  const feedbackQuery = query(
    getFeedbackRef(),
    orderByChild("createdAt"),
    limitToLast(limit)
  );

  const snapshot = await get(feedbackQuery);
  if (!snapshot.exists()) return [];

  const list = [];
  snapshot.forEach(childSnap => {
    list.push({
      id: childSnap.key,
      ...childSnap.val()
    });
  });

  return list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

export function deleteFeedback(feedbackId) {
  return remove(getFeedbackRef(feedbackId));
}
