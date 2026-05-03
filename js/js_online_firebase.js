import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get
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

export function writeRoom(roomId, data) {
  return set(getRoomRef(roomId), data);
}

export function updateRoom(roomId, patch) {
  return update(getRoomRef(roomId), patch);
}

export function readRoom(roomId) {
  return get(getRoomRef(roomId));
}

export function listenRoom(roomId, callback) {
  return onValue(getRoomRef(roomId), snapshot => {
    callback(snapshot.val());
  });
}

export function buildInitialRoomData({ mode = "online1v1" } = {}) {
  const now = Date.now();

  return {
    meta: {
      status: "waiting",
      mode,
      hostPlayer: "A",
      createdAt: now,
      updatedAt: now
    },
    players: {
      A: {
        joined: true,
        ready: false,
        unitId: null
      },
      B: {
        joined: false,
        ready: false,
        unitId: null
      }
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
