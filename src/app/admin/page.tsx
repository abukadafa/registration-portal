"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import {
  getAllParticipants,
  updateParticipantStatus,
  deleteParticipant,
  toggleAttendance,
  createParticipant,
  createParticipantsBulk,
} from "@/lib/participants";
import type { Participant, ParticipantCategory, RegistrationStatus, PaymentStatus, NewParticipantInput } from "@/lib/types";
import Link from "next/link";

const conferenceDays = [
  { id: "Day 1", date: "9 Aug", title: "Arrival & Registration" },
  { id: "Day 2", date: "10 Aug", title: "Opening Ceremony" },
  { id: "Day 3", date: "11 Aug", title: "Technical Sessions" },
  { id: "Day 4", date: "12 Aug", title: "Technical Sessions" },
  { id: "Day 5", date: "13 Aug", title: "Closing / City Tour" },
];

function getRegistrationDayLabel(createdAtString: string): string {
  try {
    const date = new Date(createdAtString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    if (dateStr === "2026-08-09") return "Day 1";
    if (dateStr === "2026-08-10") return "Day 2";
    if (dateStr === "2026-08-11") return "Day 3";
    if (dateStr === "2026-08-12") return "Day 4";
    if (dateStr === "2026-08-13") return "Day 5";
    
    const confStartDate = new Date("2026-08-09T00:00:00");
    if (date < confStartDate) return "Pre-Conference";
    return "Other";
  } catch (e) {
    return "Pre-Conference";
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading, signOut, isMock } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  
  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<"registrations" | "attendance">("registrations");

  // Registration Manager filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [regDateFilter, setRegDateFilter] = useState<string>("all");

  // Attendance Tracker filters
  const [selectedDay, setSelectedDay] = useState<string>("Day 1");
  const [attendanceSearch, setAttendanceSearch] = useState("");

  // Add Participant Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"single" | "bulk">("single");
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Single Registration Form state
  const [newTitle, setNewTitle] = useState("Mr.");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newGender, setNewGender] = useState<"Male" | "Female" | "Prefer not to say">("Prefer not to say");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newCountry, setNewCountry] = useState("Nigeria");
  const [newCategory, setNewCategory] = useState<ParticipantCategory>("Researcher");
  const [newPayment, setNewPayment] = useState<PaymentStatus>("Pending");
  const [newAccommodation, setNewAccommodation] = useState(false);
  const [newAbstract, setNewAbstract] = useState(false);

  // Bulk Registration Form state
  const [csvFileContent, setCsvFileContent] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [parsedRowsCount, setParsedRowsCount] = useState(0);
  const [parsedParticipants, setParsedParticipants] = useState<NewParticipantInput[]>([]);
  const [bulkImporting, setBulkImporting] = useState(false);

  // Fetch participants when user is loaded
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  async function fetchData() {
    setLoadingData(true);
    try {
      const data = await getAllParticipants();
      setParticipants(data);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    } finally {
      setLoadingData(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-cream)]">
        <p className="text-sm font-medium text-[var(--color-ink-soft)]">Verifying session…</p>
      </div>
    );
  }

  // Statistics for Registrations
  const totalCount = participants.length;
  const approvedCount = participants.filter((p) => p.registrationStatus === "Approved").length;
  const pendingCount = participants.filter((p) => p.registrationStatus === "Pending Approval").length;
  const rejectedCount = participants.filter((p) => p.registrationStatus === "Rejected").length;

  // Filtered participants for Registrations Tab
  const filteredParticipants = participants.filter((p) => {
    const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.badgeNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.organization && p.organization.toLowerCase().includes(search.toLowerCase()));

    const statusMatch = statusFilter === "all" || p.registrationStatus === statusFilter;
    const categoryMatch = categoryFilter === "all" || p.category === categoryFilter;
    
    const regDay = getRegistrationDayLabel(p.createdAt);
    const regDateMatch = regDateFilter === "all" || regDay === regDateFilter;

    return nameMatch && statusMatch && categoryMatch && regDateMatch;
  });

  // Approved participants (attendance applies only to approved ones)
  const approvedParticipants = participants.filter((p) => p.registrationStatus === "Approved");

  // Attendance Statistics for selected day
  const dailyPresentCount = approvedParticipants.filter(
    (p) => p.attendance && p.attendance.includes(selectedDay)
  ).length;
  const dailyAbsentCount = approvedParticipants.length - dailyPresentCount;
  const attendanceRate = approvedParticipants.length > 0 
    ? Math.round((dailyPresentCount / approvedParticipants.length) * 100) 
    : 0;

  // Filtered approved participants for selected day
  const filteredAttendanceParticipants = approvedParticipants.filter((p) => {
    const matchesSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      p.badgeNumber.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      (p.organization && p.organization.toLowerCase().includes(attendanceSearch.toLowerCase()));

    return matchesSearch;
  });

  // Handle status update (approvals)
  async function handleStatusUpdate(id: string, newStatus: RegistrationStatus) {
    try {
      await updateParticipantStatus(id, newStatus);
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, registrationStatus: newStatus } : p))
      );
      if (selectedParticipant && selectedParticipant.id === id) {
        setSelectedParticipant((prev) => (prev ? { ...prev, registrationStatus: newStatus } : null));
      }
    } catch (err) {
      alert("Failed to update status. Please check your credentials.");
      console.error(err);
    }
  }

  // Handle delete
  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to permanently delete this participant record?")) {
      return;
    }
    try {
      await deleteParticipant(id);
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      if (selectedParticipant && selectedParticipant.id === id) {
        setSelectedParticipant(null);
      }
    } catch (err) {
      alert("Failed to delete. Only admins are permitted to delete records.");
      console.error(err);
    }
  }

  // Handle toggle attendance
  async function handleToggleAttendance(id: string, day: string, currentPresent: boolean) {
    try {
      await toggleAttendance(id, day, !currentPresent);
      
      // Update state locally
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const att = p.attendance || [];
            return {
              ...p,
              attendance: !currentPresent
                ? [...att, day]
                : att.filter((d) => d !== day),
            };
          }
          return p;
        })
      );
    } catch (err) {
      alert("Failed to update attendance status.");
      console.error(err);
    }
  }

  // Export Total Registered (CSV)
  function handleExportTotalRegistered() {
    if (participants.length === 0) return;
    
    const headers = [
      "Badge Number",
      "Title",
      "First Name",
      "Last Name",
      "Gender",
      "Email",
      "Phone",
      "Category",
      "Organization",
      "Country",
      "Accommodation Needed",
      "Abstract Submitted",
      "Payment Status",
      "Registration Status",
      "Created At"
    ];

    const rows = participants.map((p) => [
      p.badgeNumber,
      p.title,
      p.firstName,
      p.lastName,
      p.gender,
      p.email,
      p.phone,
      p.category,
      p.organization,
      p.country,
      p.accommodationNeeded ? "Yes" : "No",
      p.abstractSubmitted ? "Yes" : "No",
      p.paymentStatus,
      p.registrationStatus,
      p.createdAt
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AACAA26_Total_Registered_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export Daily Attendance (CSV)
  function handleExportDailyAttendance() {
    const presentList = approvedParticipants.filter(
      (p) => p.attendance && p.attendance.includes(selectedDay)
    );
    if (presentList.length === 0) {
      alert(`No participants are marked as Present on ${selectedDay} yet.`);
      return;
    }

    const headers = [
      "Badge Number",
      "Title",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Category",
      "Organization",
      "Country",
      "Checked In Day",
    ];

    const rows = presentList.map((p) => [
      p.badgeNumber,
      p.title,
      p.firstName,
      p.lastName,
      p.email,
      p.phone,
      p.category,
      p.organization,
      p.country,
      selectedDay,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AACAA26_Attendance_${selectedDay}_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Single Form Submit
  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingSingle(true);
    try {
      const input: NewParticipantInput = {
        title: newTitle,
        firstName: newFirstName,
        lastName: newLastName,
        gender: newGender,
        email: newEmail,
        phone: newPhone,
        organization: newOrg,
        country: newCountry,
        category: newCategory,
        paymentStatus: newPayment,
        accommodationNeeded: newAccommodation,
        abstractSubmitted: newAbstract,
      };

      const record = await createParticipant(input, null);
      
      // Auto-approve registrations added by staff directly
      await updateParticipantStatus(record.id, "Approved");
      record.registrationStatus = "Approved";

      setParticipants((prev) => [record, ...prev]);
      alert(`Successfully registered and approved ${newFirstName} ${newLastName}!`);
      
      // Reset Single Form
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewOrg("");
      setNewCountry("Nigeria");
      setNewAccommodation(false);
      setNewAbstract(false);
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to add participant.");
      console.error(err);
    } finally {
      setSubmittingSingle(false);
    }
  }

  // Process CSV File Upload
  function handleCSVFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvFileContent(text);
      
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        alert("The selected CSV file appears to be empty or missing headers.");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
      const parsed: NewParticipantInput[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        const row: Record<string, string> = {};
        
        headers.forEach((header, idx) => {
          row[header] = values[idx] || "";
        });

        const pInput: NewParticipantInput = {
          title: row.title || "Mr.",
          firstName: row.firstname || row.first_name || "",
          lastName: row.lastname || row.last_name || "",
          gender: (row.gender === "Female" || row.gender === "Male" || row.gender === "Prefer not to say" ? row.gender : "Prefer not to say"),
          country: row.country || "Nigeria",
          state: row.state || "",
          organization: row.organization || "",
          department: row.department || "",
          position: row.position || "",
          email: row.email || "",
          phone: row.phone || "",
          category: (row.category || "Researcher") as ParticipantCategory,
          accommodationNeeded: row.accommodationneeded?.toLowerCase() === "true" || row.accommodationneeded === "1" || row.accommodationneeded?.toLowerCase() === "yes",
          abstractSubmitted: row.abstractsubmitted?.toLowerCase() === "true" || row.abstractsubmitted === "1" || row.abstractsubmitted?.toLowerCase() === "yes",
          paymentStatus: (row.paymentstatus || "Pending") as PaymentStatus,
        };

        if (pInput.firstName && pInput.lastName && pInput.email) {
          parsed.push(pInput);
        }
      }

      setParsedRowsCount(parsed.length);
      setParsedParticipants(parsed);
    };
    reader.readAsText(file);
  }

  // Bulk CSV Import Submit
  async function handleAddBulk() {
    if (parsedParticipants.length === 0) {
      alert("No valid rows parsed from the CSV file.");
      return;
    }
    setBulkImporting(true);
    try {
      const imported = await createParticipantsBulk(parsedParticipants);
      
      const latest = await getAllParticipants();
      setParticipants(latest);

      alert(`Successfully imported ${imported.length} new approved participants! (Skipped ${parsedParticipants.length - imported.length} duplicates)`);
      
      setCsvFileContent(null);
      setCsvFileName("");
      setParsedRowsCount(0);
      setParsedParticipants([]);
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to bulk import participants.");
      console.error(err);
    } finally {
      setBulkImporting(false);
    }
  }

  function handleClearMockData() {
    if (!window.confirm("Are you sure you want to delete all local participants? This will remove all registration and attendance records.")) {
      return;
    }
    localStorage.setItem("mock_participants", JSON.stringify([]));
    setParticipants([]);
    setSelectedParticipant(null);
    alert("Local database cleared successfully! You can now test with your own data.");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream)]">
      <SiteHeader />

      <main className="flex-1 px-6 py-10 max-w-7xl mx-auto w-full">
        {/* Mock Mode DB Reset Warning Banner */}
        {isMock && (
          <div className="mb-6 rounded-2xl bg-amber-50 p-4 border border-amber-250 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-amber-800">
              <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                <span>⚠️</span> Developer Mock Mode Active
              </p>
              <p>All database records are stored inside your browser's LocalStorage. This is great for zero-config testing.</p>
            </div>
            <div>
              <button
                onClick={handleClearMockData}
                className="rounded-full bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Clear Local Database
              </button>
            </div>
          </div>
        )}

        {/* Top Header bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold italic text-[var(--color-forest)]">
              Admin Control Panel
            </h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Logged in as <span className="font-semibold text-[var(--color-forest-light)]">{user.displayName}</span> ({user.role})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-full bg-[var(--color-forest)] hover:bg-[var(--color-forest-deep)] text-white px-5 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              ➕ Add Participant
            </button>
            {activeTab === "registrations" ? (
              <button
                onClick={handleExportTotalRegistered}
                disabled={participants.length === 0}
                className="rounded-full bg-white border border-black/10 px-5 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                📥 Export Total Registered (CSV)
              </button>
            ) : (
              <button
                onClick={handleExportDailyAttendance}
                disabled={dailyPresentCount === 0}
                className="rounded-full bg-white border border-black/10 px-5 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                📥 Export {selectedDay} Attendance (CSV)
              </button>
            )}
            <button
              onClick={() => signOut()}
              className="rounded-full bg-red-700 text-white px-5 py-2 text-xs font-semibold hover:bg-red-800 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-black/10 mb-8 space-x-8">
          <button
            onClick={() => setActiveTab("registrations")}
            className={`pb-4 text-sm font-semibold transition-colors cursor-pointer relative ${
              activeTab === "registrations"
                ? "text-[var(--color-forest)] font-bold"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-forest)]"
            }`}
          >
            Registrations Manager
            {activeTab === "registrations" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-forest)] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-4 text-sm font-semibold transition-colors cursor-pointer relative ${
              activeTab === "attendance"
                ? "text-[var(--color-forest)] font-bold"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-forest)]"
            }`}
          >
            Daily Attendance Tracker
            {activeTab === "attendance" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-forest)] rounded-full" />
            )}
          </button>
        </div>

        {/* ==================== TAB 1: REGISTRATIONS MANAGER ==================== */}
        {activeTab === "registrations" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-[var(--color-ink-soft)]">Total Registered</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-forest)]">
                  {totalCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-emerald-800 font-semibold">Approved</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-emerald-700">
                  {approvedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-amber-850 font-semibold">Pending Approval</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-amber-600">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-red-800 font-semibold">Rejected</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-red-600">
                  {rejectedCount}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Search by name, email, badge..."
                  className="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Registration Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <select
                  className="input"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Participant Categories</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Policy Maker">Policy Maker</option>
                  <option value="Industry / Private Sector">Industry / Private Sector</option>
                  <option value="Farmer">Farmer</option>
                  <option value="Student">Student</option>
                  <option value="Development Partner">Development Partner</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Media">Media</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <select
                  className="input"
                  value={regDateFilter}
                  onChange={(e) => setRegDateFilter(e.target.value)}
                >
                  <option value="all">All Registration Periods</option>
                  <option value="Pre-Conference">Pre-Conference (Before Aug 9)</option>
                  <option value="Day 1">Day 1 (9 Aug)</option>
                  <option value="Day 2">Day 2 (10 Aug)</option>
                  <option value="Day 3">Day 3 (11 Aug)</option>
                  <option value="Day 4">Day 4 (12 Aug)</option>
                  <option value="Day 5">Day 5 (13 Aug)</option>
                </select>
              </div>
            </div>

            {/* Content Layout */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* List Table */}
              <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                {loadingData ? (
                  <div className="p-10 text-center text-sm text-[var(--color-ink-soft)]">
                    Loading registrations…
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[var(--color-ink-soft)]">
                    No matching participants found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-black/2 border-b border-black/5 font-semibold text-[var(--color-ink-soft)]">
                          <th className="p-4">Participant</th>
                          <th className="p-4">Badge ID / Date</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {filteredParticipants.map((p) => {
                          const dateObj = new Date(p.createdAt);
                          const formattedDate = dateObj.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false
                          });
                          const regDay = getRegistrationDayLabel(p.createdAt);
                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-black/[0.01] transition cursor-pointer ${
                                selectedParticipant?.id === p.id ? "bg-black/[0.03]" : ""
                              }`}
                              onClick={() => setSelectedParticipant(p)}
                            >
                              <td className="p-4">
                                <p className="font-semibold text-[var(--color-ink)]">
                                  {p.title} {p.firstName} {p.lastName}
                                </p>
                                <p className="text-xs text-[var(--color-ink-soft)]">{p.email}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-mono text-xs">{p.badgeNumber}</p>
                                <p className="text-[10px] text-black/40 mt-0.5">
                                  {formattedDate} ({regDay})
                                </p>
                              </td>
                              <td className="p-4 text-xs text-[var(--color-ink-soft)]">{p.category}</td>
                              <td className="p-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    p.registrationStatus === "Approved"
                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
                                      : p.registrationStatus === "Rejected"
                                      ? "bg-red-50 text-red-700 ring-1 ring-red-600/10"
                                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10"
                                  }`}
                                >
                                  {p.registrationStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Details Drawer */}
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm h-fit">
                {selectedParticipant ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-forest)]">
                          {selectedParticipant.title} {selectedParticipant.firstName} {selectedParticipant.lastName}
                        </h2>
                        <p className="text-xs font-mono text-[var(--color-ink-soft)] mt-0.5">
                          {selectedParticipant.badgeNumber}
                        </p>
                      </div>
                      {/* Badge Link */}
                      <Link
                        href={`/badge/${selectedParticipant.id}`}
                        target="_blank"
                        className="rounded-full bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-light)] p-2 text-xs font-medium transition flex items-center justify-center w-8 h-8"
                        title="View Badge"
                      >
                        🏷️
                      </Link>
                    </div>

                    {/* Photo */}
                    <div className="flex justify-center">
                      {selectedParticipant.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedParticipant.photoUrl}
                          alt="Passport"
                          className="w-28 h-28 object-cover rounded-xl border border-black/10 shadow-sm"
                        />
                      ) : (
                        <div className="w-28 h-28 bg-black/5 rounded-xl border border-dashed border-black/20 flex flex-col items-center justify-center text-xs text-[var(--color-ink-soft)]">
                          <span>No Photo</span>
                          <span>Uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Details list */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Email</p>
                        <p className="font-medium truncate" title={selectedParticipant.email}>{selectedParticipant.email}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Phone</p>
                        <p className="font-medium">{selectedParticipant.phone}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Organization</p>
                        <p className="font-medium truncate" title={selectedParticipant.organization}>{selectedParticipant.organization}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Country</p>
                        <p className="font-medium">{selectedParticipant.country}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Category</p>
                        <p className="font-medium">{selectedParticipant.category}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Payment</p>
                        <p className="font-medium">{selectedParticipant.paymentStatus}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Abstract</p>
                        <p className="font-medium">{selectedParticipant.abstractSubmitted ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-black/40 uppercase tracking-wider">Accommodation</p>
                        <p className="font-medium">{selectedParticipant.accommodationNeeded ? "Needed" : "Not Needed"}</p>
                      </div>
                    </div>

                    {/* Status Toggle & Admin Actions */}
                    <div className="border-t border-black/5 pt-5 space-y-3">
                      <p className="text-xs font-semibold text-black/40 uppercase tracking-wider">
                        Approval Decision
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(selectedParticipant.id, "Approved")}
                          disabled={selectedParticipant.registrationStatus === "Approved"}
                          className="flex-1 rounded-full bg-emerald-700 text-white font-semibold text-xs py-2.5 transition hover:bg-emerald-800 disabled:opacity-50 cursor-pointer text-center"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedParticipant.id, "Rejected")}
                          disabled={selectedParticipant.registrationStatus === "Rejected"}
                          className="flex-1 rounded-full bg-red-700 text-white font-semibold text-xs py-2.5 transition hover:bg-red-800 disabled:opacity-50 cursor-pointer text-center"
                        >
                          Reject
                        </button>
                      </div>

                      {user.role === "admin" && (
                        <button
                          onClick={() => handleDelete(selectedParticipant.id)}
                          className="w-full rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs py-2 transition mt-2 cursor-pointer"
                        >
                          Delete Registration
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-sm text-[var(--color-ink-soft)]">
                    Select a participant from the table to view their details, check photos, and make decisions.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 2: DAILY ATTENDANCE TRACKER (INDEPENDENT DAYS) ==================== */}
        {activeTab === "attendance" && (
          <>
            {/* Day Selector */}
            <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                Select Conference Day
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {conferenceDays.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(d.id)}
                    className={`rounded-xl px-4 py-3 transition text-center flex flex-col items-center justify-center cursor-pointer ${
                      selectedDay === d.id
                        ? "bg-[var(--color-forest)] text-white shadow-md font-semibold"
                        : "bg-[var(--color-cream)] hover:bg-black/5 text-[var(--color-ink)]"
                    }`}
                  >
                    <span className="text-xs font-mono uppercase tracking-wider opacity-80">{d.id}</span>
                    <span className="text-xs font-bold mt-0.5">{d.date}</span>
                    <span className="text-[10px] truncate max-w-full font-medium opacity-70" title={d.title}>
                      {d.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Attendance Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-[var(--color-ink-soft)]">Approved Registry</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-forest)]">
                  {approvedParticipants.length}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-emerald-800 font-semibold">Attended ({selectedDay})</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-emerald-700">
                  {dailyPresentCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-amber-850 font-semibold">Did Not Attend ({selectedDay})</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-amber-600">
                  {dailyAbsentCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-[var(--color-gold)] font-semibold">Attendance Rate</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-gold)]">
                  {attendanceRate}%
                </p>
              </div>
            </div>

            {/* Attendance Filter Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold italic text-[var(--color-forest)]">
                  Attendance registry for {selectedDay}
                </h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                  Showing all approved participants. Check boxes to mark their check-in for {selectedDay}.
                </p>
              </div>
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Filter list by name/badge/email..."
                  className="input"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Daily Independent Table */}
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden mb-6">
              {loadingData ? (
                <div className="p-10 text-center text-sm text-[var(--color-ink-soft)]">
                  Loading attendance records…
                </div>
              ) : filteredAttendanceParticipants.length === 0 ? (
                <div className="p-12 text-center text-sm text-[var(--color-ink-soft)]">
                  <p className="font-semibold text-base text-[var(--color-ink)]">No approved participants found.</p>
                  <p className="mt-1">Approved participants will automatically appear in this registry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-black/2 border-b border-black/5 font-semibold text-[var(--color-ink-soft)]">
                        <th className="p-4">Attendee</th>
                        <th className="p-4">Badge ID</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Organization</th>
                        <th className="p-4 text-center">Attended {selectedDay}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredAttendanceParticipants.map((p) => {
                        const isPresent = p.attendance && p.attendance.includes(selectedDay);
                        return (
                          <tr key={p.id} className="hover:bg-black/[0.005] transition">
                            <td className="p-4">
                              <p className="font-semibold text-[var(--color-ink)]">
                                {p.title} {p.firstName} {p.lastName}
                              </p>
                              <p className="text-xs text-[var(--color-ink-soft)]">{p.email}</p>
                            </td>
                            <td className="p-4 font-mono text-xs">{p.badgeNumber}</td>
                            <td className="p-4 text-xs text-[var(--color-ink-soft)]">{p.category}</td>
                            <td className="p-4 text-xs text-[var(--color-ink-soft)] max-w-[150px] truncate" title={p.organization}>
                              {p.organization}
                            </td>
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={!!isPresent}
                                onChange={() => handleToggleAttendance(p.id, selectedDay, !!isPresent)}
                                className="w-5 h-5 rounded border-black/25 text-[var(--color-forest)] focus:ring-[var(--color-forest)] transition cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ==================== MODAL OVERLAY: ADD PARTICIPANT (SINGLE / BULK) ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-[var(--color-cream)]">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-forest)]">
                  Add Participant to Portal
                </h3>
                <p className="text-xs text-[var(--color-ink-soft)] font-medium mt-0.5">
                  Register attendees manually via single entry or bulk CSV upload
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition text-lg text-[var(--color-ink-soft)] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-black/5 bg-white px-6">
              <button
                onClick={() => setAddModalTab("single")}
                className={`py-3.5 text-xs font-semibold border-b-2 transition-colors mr-6 cursor-pointer ${
                  addModalTab === "single"
                    ? "border-[var(--color-forest)] text-[var(--color-forest)] font-bold"
                    : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-forest)]"
                }`}
              >
                Single Entry Form
              </button>
              <button
                onClick={() => setAddModalTab("bulk")}
                className={`py-3.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  addModalTab === "bulk"
                    ? "border-[var(--color-forest)] text-[var(--color-forest)] font-bold"
                    : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-forest)]"
                }`}
              >
                Bulk CSV Import
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-black/[0.01]">
              {/* TAB A: SINGLE ENTRY FORM */}
              {addModalTab === "single" && (
                <form onSubmit={handleAddSingle} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Title
                      </label>
                      <select
                        className="input"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                        <option value="Engr.">Engr.</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        First Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="John"
                        className="input"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                      Last Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Doe"
                      className="input"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Gender
                      </label>
                      <select
                        className="input"
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value as any)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Participant Category
                      </label>
                      <select
                        className="input"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                      >
                        <option value="Researcher">Researcher</option>
                        <option value="Policy Maker">Policy Maker</option>
                        <option value="Industry / Private Sector">Industry / Private Sector</option>
                        <option value="Farmer">Farmer</option>
                        <option value="Student">Student</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Sponsor">Sponsor</option>
                        <option value="Media">Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="john.doe@organization.org"
                        className="input"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Phone Number
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="+2348031234567"
                        className="input"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Organization
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="E.g., University of Ibadan"
                        className="input"
                        value={newOrg}
                        onChange={(e) => setNewOrg(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Country
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Nigeria"
                        className="input"
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-black/5 pt-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                        Payment Status
                      </label>
                      <select
                        className="input"
                        value={newPayment}
                        onChange={(e) => setNewPayment(e.target.value as any)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Waived">Waived</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="inline-flex items-center text-xs font-semibold text-[var(--color-ink-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAccommodation}
                          onChange={(e) => setNewAccommodation(e.target.checked)}
                          className="w-4 h-4 rounded text-[var(--color-forest)] focus:ring-[var(--color-forest)] border-black/10 mr-2 cursor-pointer"
                        />
                        Accommodation
                      </label>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="inline-flex items-center text-xs font-semibold text-[var(--color-ink-soft)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAbstract}
                          onChange={(e) => setNewAbstract(e.target.checked)}
                          className="w-4 h-4 rounded text-[var(--color-forest)] focus:ring-[var(--color-forest)] border-black/10 mr-2 cursor-pointer"
                        />
                        Abstract Submitted
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-black/5 pt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingSingle}
                      className="rounded-full bg-[var(--color-forest)] hover:bg-[var(--color-forest-deep)] text-white font-semibold text-xs px-6 py-3 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {submittingSingle ? "Registering…" : "Register Participant"}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB B: BULK CSV UPLOAD */}
              {addModalTab === "bulk" && (
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-white p-4 rounded-2xl border border-black/5 text-xs text-[var(--color-ink-soft)] space-y-1.5 shadow-sm">
                    <p className="font-bold text-[var(--color-forest)]">CSV Template Formatting Guidelines:</p>
                    <p>
                      Ensure your CSV columns match the following headers exactly (case-insensitive):
                    </p>
                    <code className="block bg-black/5 p-2 rounded font-mono text-[10px] select-all break-all">
                      title, firstName, lastName, email, phone, gender, category, organization, country, paymentStatus, accommodationNeeded, abstractSubmitted
                    </code>
                    <p className="text-[10px] text-black/40 mt-1">
                      * Values for `accommodationNeeded` and `abstractSubmitted` should be `yes`/`no` or `true`/`false`.
                    </p>
                  </div>

                  {/* File Upload Selector */}
                  <div className="border-2 border-dashed border-black/15 bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVFileChange}
                      className="hidden"
                      id="bulk-csv-uploader"
                    />
                    <label
                      htmlFor="bulk-csv-uploader"
                      className="cursor-pointer bg-[var(--color-cream)] hover:bg-black/5 text-[var(--color-forest)] font-semibold text-xs px-5 py-3 rounded-full transition shadow-sm"
                    >
                      Choose CSV File
                    </label>
                    {csvFileName ? (
                      <p className="mt-3 text-xs font-semibold text-[var(--color-forest-light)]">
                        📄 {csvFileName} ({parsedRowsCount} valid rows parsed)
                      </p>
                    ) : (
                      <p className="mt-2.5 text-[11px] text-[var(--color-ink-soft)]">
                        Select a .csv file to parse and upload
                      </p>
                    )}
                  </div>

                  {/* Import Button */}
                  {parsedRowsCount > 0 && (
                    <div className="flex justify-end border-t border-black/5 pt-4">
                      <button
                        onClick={handleAddBulk}
                        disabled={bulkImporting}
                        className="rounded-full bg-[var(--color-forest)] hover:bg-[var(--color-forest-deep)] text-white font-semibold text-xs px-6 py-3 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        {bulkImporting ? "Importing…" : `Import ${parsedRowsCount} Participants`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
