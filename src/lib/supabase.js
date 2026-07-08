import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const jeannettePhone = (import.meta.env.VITE_WHATSAPP_NUMBER || "96176818120").replace(/[^0-9]/g, "");
export const jeannettePhoneDisplay = "+961 76 818 120";

export const hasSupabase =
  url.includes(".supabase.co") &&
  anonKey.length > 40 &&
  !anonKey.includes("your-anon-public-key") &&
  !url.includes("your-project-ref");

export const supabase = hasSupabase ? createClient(url, anonKey) : null;

export async function isCurrentUserFixedAdmin() {
  if (!hasSupabase || !supabase) return false;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.email) return false;

  const { data, error } = await supabase.rpc("is_fixed_admin");
  if (error) return false;

  return data === true;
}

function cleanLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function whatsappUrl(message) {
  return `https://wa.me/${jeannettePhone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppLink(project) {
  const currentPage = typeof window !== "undefined" ? window.location.href : "";

  if (!project) {
    return whatsappUrl("Hello Jeannette, I want to ask about your work.");
  }

  const lines = [
    "Hello Jeannette, I am interested in this project/item.",
    "",
    `Item: ${cleanLine(project.name) || "Project"}`,
    `Price: $${Number(project.price || 0).toFixed(2)}`,
    `Category: ${cleanLine(project.category)}`,
    `Type: ${cleanLine(project.type) || "Not specified"}`,
  ];

  if (project.description) lines.push(`Description: ${cleanLine(project.description)}`);
  if (currentPage) lines.push(`Page: ${currentPage}`);

  return whatsappUrl(lines.join("\n"));
}

export function buildContactWhatsAppLink(form) {
  const lines = [
    "Hello Jeannette, I want to collaborate.",
    "",
    `Name: ${cleanLine(form.name)}`,
    `Email: ${cleanLine(form.email)}`,
    `Business name: ${cleanLine(form.businessName) || "Not provided"}`,
    `Project type: ${cleanLine(form.projectType) || "Not specified"}`,
    `Message: ${cleanLine(form.message)}`,
  ];

  return whatsappUrl(lines.join("\n"));
}
