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
import { db, storage, isFirebaseConfigured } from "./firebase";
import type { NewParticipantInput, Participant } from "./types";

const PARTICIPANTS = "participants";
const COUNTERS = "counters";
const CONFERENCE_CODE = "9AACAA26";

// Local storage keys for mock mode
const MOCK_PARTICIPANTS_KEY = "mock_participants";

export class DuplicateParticipantError extends Error {
  field: "email" | "phone";
  constructor(field: "email" | "phone") {
    super(`A participant with this ${field} is already registered.`);
    this.field = field;
  }
}

export function getMockParticipants(): Participant[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_PARTICIPANTS_KEY);
  if (!stored) {
    const seed: Participant[] = [
      {
        id: "mock-1",
        badgeNumber: "9AACAA26-00001",
        title: "Prof.",
        firstName: "Kwame",
        lastName: "Mensah",
        gender: "Male",
        country: "Ghana",
        organization: "University of Ghana",
        category: "Speaker",
        email: "kwame.mensah@ug.edu.gh",
        phone: "+233201234567",
        paymentStatus: "Paid",
        registrationStatus: "Approved",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        accommodationNeeded: true,
        abstractSubmitted: true,
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150",
        attendance: ["Day 1", "Day 2"],
      },
      {
        id: "mock-2",
        badgeNumber: "9AACAA26-00002",
        title: "Dr.",
        firstName: "Amina",
        lastName: "Okei",
        gender: "Female",
        country: "Nigeria",
        organization: "Ahmadu Bello University",
        category: "Researcher",
        email: "amina.okei@abu.edu.ng",
        phone: "+2348031234567",
        paymentStatus: "Pending",
        registrationStatus: "Pending Approval",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        accommodationNeeded: false,
        abstractSubmitted: false,
        photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
        attendance: [],
      },
      {
        id: "mock-3",
        badgeNumber: "9AACAA26-00003",
        title: "Mr.",
        firstName: "Jean",
        lastName: "Kaboré",
        gender: "Male",
        country: "Burkina Faso",
        organization: "INERA",
        category: "Policy Maker",
        email: "jean.kabore@inera.bf",
        phone: "+22625300000",
        paymentStatus: "Waived",
        registrationStatus: "Pending Approval",
        createdAt: new Date(Date.now() - 600000).toISOString(),
        accommodationNeeded: true,
        abstractSubmitted: false,
        attendance: [],
      }
    ];
    localStorage.setItem(MOCK_PARTICIPANTS_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(stored);
}

export function saveMockParticipants(list: Participant[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_PARTICIPANTS_KEY, JSON.stringify(list));
}

export async function findDuplicate(email: string, phone: string) {
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    const dupEmail = list.find((p) => p.email === email.trim().toLowerCase());
    if (dupEmail) return "email" as const;
    const dupPhone = list.find((p) => p.phone === phone.trim());
    if (dupPhone) return "phone" as const;
    return null;
  }

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
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    const nextVal = list.length + 1;
    return `${CONFERENCE_CODE}-${String(nextVal).padStart(5, "0")}`;
  }

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
  if (!isFirebaseConfigured) {
    if (file.size < 150 * 1024) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";
  }

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

  if (!isFirebaseConfigured) {
    const mockId = `mock-${Math.random().toString(36).substr(2, 9)}`;
    let photoUrl: string | undefined;
    if (photoFile) {
      photoUrl = await uploadParticipantPhoto(mockId, photoFile);
    }
    const record: Participant = {
      ...input,
      id: mockId,
      email,
      phone,
      badgeNumber,
      photoUrl: photoUrl ?? undefined,
      registrationStatus: "Pending Approval",
      createdAt: new Date().toISOString(),
    };
    const list = getMockParticipants();
    list.push(record);
    saveMockParticipants(list);
    return record;
  }

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
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    return list.find((p) => p.id === id) ?? null;
  }

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

export async function getAllParticipants(): Promise<Participant[]> {
  if (!isFirebaseConfigured) {
    return getMockParticipants().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
  const q = query(collection(db, PARTICIPANTS), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString();
    return {
      id: docSnap.id,
      ...(data as Omit<Participant, "id" | "createdAt">),
      createdAt,
    };
  });
}

export async function updateParticipantStatus(
  id: string,
  status: "Pending Approval" | "Approved" | "Rejected"
): Promise<void> {
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      list[index].registrationStatus = status;
      saveMockParticipants(list);
    }
    return;
  }

  const { doc, updateDoc } = await import("firebase/firestore");
  const participantRef = doc(db, PARTICIPANTS, id);
  await updateDoc(participantRef, { registrationStatus: status });
}

export async function deleteParticipant(id: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    const filtered = list.filter((p) => p.id !== id);
    saveMockParticipants(filtered);
    return;
  }

  const { doc, deleteDoc } = await import("firebase/firestore");
  const participantRef = doc(db, PARTICIPANTS, id);
  await deleteDoc(participantRef);
}

export async function toggleAttendance(
  id: string,
  day: string,
  present: boolean
): Promise<void> {
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    const index = list.findIndex((p) => p.id === id);
    if (index !== -1) {
      const currentAttendance = list[index].attendance || [];
      if (present) {
        if (!currentAttendance.includes(day)) {
          list[index].attendance = [...currentAttendance, day];
        }
      } else {
        list[index].attendance = currentAttendance.filter((d) => d !== day);
      }
      saveMockParticipants(list);
    }
    return;
  }

  const { doc, updateDoc, arrayUnion, arrayRemove } = await import("firebase/firestore");
  const participantRef = doc(db, PARTICIPANTS, id);
  if (present) {
    await updateDoc(participantRef, {
      attendance: arrayUnion(day),
    });
  } else {
    await updateDoc(participantRef, {
      attendance: arrayRemove(day),
    });
  }
}

export async function createParticipantsBulk(
  inputs: NewParticipantInput[]
): Promise<Participant[]> {
  if (!isFirebaseConfigured) {
    const list = getMockParticipants();
    const imported: Participant[] = [];
    let nextVal = list.length + 1;

    for (const input of inputs) {
      const email = input.email.trim().toLowerCase();
      const phone = input.phone.trim();

      // Check duplicates in list & current imported batch
      const isDuplicate =
        list.some((p) => p.email === email || p.phone === phone) ||
        imported.some((p) => p.email === email || p.phone === phone);

      if (isDuplicate) continue;

      const badgeNumber = `${CONFERENCE_CODE}-${String(nextVal++).padStart(5, "0")}`;
      const mockId = `mock-${Math.random().toString(36).substr(2, 9)}`;

      const record: Participant = {
        ...input,
        id: mockId,
        email,
        phone,
        badgeNumber,
        registrationStatus: "Approved",
        createdAt: new Date().toISOString(),
        attendance: [],
      };
      imported.push(record);
    }

    const updatedList = [...list, ...imported];
    saveMockParticipants(updatedList);
    return imported;
  }

  const { writeBatch, doc, collection, getDoc } = await import("firebase/firestore");
  const batch = writeBatch(db);
  const imported: Participant[] = [];

  const counterRef = doc(db, COUNTERS, "badgeSequence");
  const counterSnap = await getDoc(counterRef);
  let currentVal = counterSnap.exists() ? (counterSnap.data().value as number) : 0;

  for (const input of inputs) {
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();

    currentVal++;
    const badgeNumber = `${CONFERENCE_CODE}-${String(currentVal).padStart(5, "0")}`;
    const participantRef = doc(collection(db, PARTICIPANTS));

    const record = {
      ...input,
      email,
      phone,
      badgeNumber,
      photoUrl: null,
      registrationStatus: "Approved" as const,
      createdAt: serverTimestamp(),
      attendance: [],
    };

    batch.set(participantRef, record);
    
    imported.push({
      ...input,
      id: participantRef.id,
      badgeNumber,
      email,
      phone,
      registrationStatus: "Approved",
      createdAt: new Date().toISOString(),
      attendance: [],
    });
  }

  batch.set(counterRef, { value: currentVal }, { merge: true });
  await batch.commit();

  return imported;
}



