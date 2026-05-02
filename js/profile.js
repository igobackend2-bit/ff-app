// ============================================================
// profile.js — User profile page logic
// ============================================================

import { supabase, getSession, saveSession, clearSession } from "./supabase.js";
import { showToast } from "./utils.js";

export async function loadProfile() {
  const user = getSession();
  if (!user) { window.location.href = "/login.html"; return null; }
  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (error || !data) { showToast("Could not load profile.", "error"); return user; }
  saveSession(data);
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single();
  if (error) return { success: false, error: "Failed to update profile." };
  saveSession(data);
  return { success: true, user: data };
}

export function getInitials(name) {
  if (!name) return "FF";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function logout() {
  clearSession();
  window.location.href = "/login.html";
}
