import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { NewParticipantInput, Participant } from "./types";

const PARTICIPANTS = "participants";
const COUNTERS = "counters";
const CONFERENCE_CODE = "9AACAA26";

export class DuplicateParticipantError extends Error {
  field: "email" | "phone";
  constructor(field: "email" | "phone") {
    super(`A participant with this ${field} is already registered.`);
    this.field = field;
  }
}

export async function findDuplicate(email: string, phone: string) {
  const emailQuery = query(
    collection(db, PARTICIPANTS),
    where("email", "==", email.trim().toLowerCase())
  );
  const emailSnap = await getDocs(emailQuery);
  if (!emailSnap.empty) return "email" as const;

  const phoneQuery = query(
    collection(db, PARTICIPANTS),
    where("phone", "==", phone.trim())
  );
  const phoneSnap = await getDocs(phoneQuery);
  if (!phoneSnap.empty) return "phone" as const;

  return null;
}

async function nextBadgeNumber(): Promise<string> {
  const counterRef = doc(db, COUNTERS, "badgeSequence");
  const nextValue = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().value as number) : 0;
    const next = current + 1;
    tx.set(counterRef, { value: next }, { merge: true });
    return next;
  });
  return `${CONFERENCE_CODE}-${String(nextValue).padStart(5, "0")}`;
}

export async function uploadParticipantPhoto(participantId: string, file: File) {
  const photoRef = ref(storage, `participant-photos/${participantId}`);
  await uploadBytes(photoRef, file);
  return getDownloadURL(photoRef);
}

export async function createParticipant(
  input: NewParticipantInput,
  photoFile?: File | null
): Promise<Participant> {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  const duplicateField = await findDuplicate(email, phone);
  if (duplicateField) throw new DuplicateParticipantError(duplicateField);

  const badgeNumber = await nextBadgeNumber();
  const participantRef = doc(collection(db, PARTICIPANTS));

  let photoUrl: string | undefined;
  if (photoFile) {
    photoUrl = await uploadParticipantPhoto(participantRef.id, photoFile);
  }

  const record = {
    ...input,
    email,
    phone,
    badgeNumber,
    photoUrl: photoUrl ?? null,
    registrationStatus: "Pending Approval" as const,
    createdAt: serverTimestamp(),
  };

  const { setDoc } = await import("firebase/firestore");
  await setDoc(participantRef, record);

  return {
    ...input,
    id: participantRef.id,
    badgeNumber,
    email,
    phone,
    photoUrl,
    registrationStatus: "Pending Approval",
    createdAt: new Date().toISOString(),
  };
}

export async function getParticipant(id: string): Promise<Participant | null> {
  const snap = await getDoc(doc(db, PARTICIPANTS, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  const createdAt =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString();
  return {
    id: snap.id,
    ...(data as Omit<Participant, "id" | "createdAt">),
    createdAt,
  };
}
