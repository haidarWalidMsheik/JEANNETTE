import { supabase, hasSupabase } from "../lib/supabase";
import { categoryOrder } from "../config/categories";

const MAX_ORIGINAL_IMAGE_SIZE = 25 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIDE = 3000;

function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    const byCategory = categoryOrder(a.category) - categoryOrder(b.category);
    if (byCategory !== 0) return byCategory;

    const bySort = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (bySort !== 0) return bySort;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function requireSupabase() {
  if (!hasSupabase || !supabase) {
    throw new Error(
      "Supabase is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first."
    );
  }

  return supabase;
}

function blobToFile(blob, originalName) {
  const baseName =
    String(originalName || "project-image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 80) || "project-image";

  return new File([blob], `${baseName}-web.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress image. Please try another photo."));
        } else {
          resolve(blob);
        }
      },
      "image/jpeg",
      quality
    );
  });
}

async function prepareImageForUpload(file) {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > MAX_ORIGINAL_IMAGE_SIZE) {
    throw new Error("This photo is too huge. Please choose a photo smaller than 25 MB.");
  }

  if (file.type === "image/gif") {
    if (file.size > MAX_UPLOAD_IMAGE_SIZE) {
      throw new Error(
        "GIF images must be smaller than 5 MB. Use JPG, PNG, or WEBP for large project photos."
      );
    }

    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const img = new Image();
    img.decoding = "async";
    img.src = imageUrl;
    await img.decode();

    // Preserve the width of tall portfolio designs. Limiting by the longest
    // side would make a tall design too narrow and pixelated at full width.
    const scale = Math.min(1, MAX_IMAGE_SIDE / img.width);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    if (
      scale === 1 &&
      file.size <= MAX_UPLOAD_IMAGE_SIZE &&
      /image\/(jpeg|jpg|webp)/.test(file.type)
    ) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const qualities = [0.92, 0.86, 0.78, 0.7];
    let bestBlob = null;

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, quality);
      bestBlob = blob;

      if (blob.size <= MAX_UPLOAD_IMAGE_SIZE) break;
    }

    const prepared = blobToFile(bestBlob, file.name);

    if (prepared.size > MAX_UPLOAD_IMAGE_SIZE) {
      throw new Error("Image is still too large after compression. Please use a smaller photo.");
    }

    return prepared;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function formatMb(bytes) {
  return `${(Number(bytes || 0) / (1024 * 1024)).toFixed(2)} MB`;
}

async function uploadProjectImage(db, file, folderName) {
  if (!file) return null;

  const preparedImage = await prepareImageForUpload(file);

  if (preparedImage.size > MAX_UPLOAD_IMAGE_SIZE) {
    throw new Error(
      `Image must be smaller than 5 MB after compression. Current size: ${formatMb(
        preparedImage.size
      )}.`
    );
  }

  const safeName = preparedImage.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const image_path = `${folderName}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await db.storage
    .from("project-images")
    .upload(image_path, preparedImage, {
      cacheControl: "3600",
      upsert: false,
      contentType: preparedImage.type,
    });

  if (uploadError) throw uploadError;

  const { data } = db.storage.from("project-images").getPublicUrl(image_path);

  return {
    url: data.publicUrl,
    path: image_path,
  };
}

export async function listProjects() {
  if (!hasSupabase || !supabase) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return sortProjects(data || []);
}

export async function getProjectById(id) {
  if (!id) throw new Error("Missing project id.");

  const db = requireSupabase();

  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function saveProject(project, cardImageFile, detailImageFile) {
  const db = requireSupabase();

  const cleaned = {
    name: String(project.name || "").trim(),
    category: project.category,
    description: String(project.description || "").trim(),
    sort_order: Number(project.sort_order || 0),

    image_url: project.image_url || null,
    image_path: project.image_path || null,

    card_image_url: project.card_image_url || project.image_url || null,
    card_image_path: project.card_image_path || project.image_path || null,

    detail_image_url: project.detail_image_url || project.image_url || null,
    detail_image_path: project.detail_image_path || project.image_path || null,
  };

  if (!cleaned.name) throw new Error("Project name is required.");
  if (!cleaned.category) throw new Error("Category is required.");

  const cardUpload = await uploadProjectImage(db, cardImageFile, "card");

  if (cardUpload) {
    cleaned.card_image_url = cardUpload.url;
    cleaned.card_image_path = cardUpload.path;

    cleaned.image_url = cardUpload.url;
    cleaned.image_path = cardUpload.path;
  }

  const detailUpload = await uploadProjectImage(db, detailImageFile, "detail");

  if (detailUpload) {
    cleaned.detail_image_url = detailUpload.url;
    cleaned.detail_image_path = detailUpload.path;
  }

  if (project.id) {
    const { data, error } = await db
      .from("projects")
      .update(cleaned)
      .eq("id", project.id)
      .select("*")
      .single();

    if (error) throw error;

    return data;
  }

  const { data, error } = await db
    .from("projects")
    .insert([cleaned])
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function deleteProject(project) {
  if (!project?.id) return;

  const db = requireSupabase();

  const { error } = await db.from("projects").delete().eq("id", project.id);

  if (error) throw error;

  const paths = [
    project.image_path,
    project.card_image_path,
    project.detail_image_path,
  ].filter(Boolean);

  if (paths.length) {
    await db.storage.from("project-images").remove(paths);
  }
}
