/**
 * Renderiza el grid de productos de una división consumiendo la API pública.
 * Se llama desde cada página de listing (madera, cafe, hospitalidad, transporte).
 */
import { fetchProducts } from "./api.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const ARROW_SVG = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 448 512"><path d="M438.6 278.6l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L338.7 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h306.7L233.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160c12.5 12.5 12.5 32.8 0 45.3z"/></svg>`;

/**
 * En desarrollo (Astro dev sin rewrites), los detalles deben ir a /producto?division=...&slug=...
 * En producción (con Firebase Hosting rewrites), van a la URL bonita /<division>/<slug>.
 */
const buildDetailUrl = (urlPrefix, divisionSlug, slug) => {
  if (import.meta.env.DEV) {
    return `/producto?division=${encodeURIComponent(divisionSlug)}&slug=${encodeURIComponent(slug)}`;
  }
  return `${urlPrefix}/${encodeURIComponent(slug)}`;
};

/**
 * @param {string} containerId - id del div que contendrá las tarjetas
 * @param {"MADERA"|"HOSPITALIDAD"|"CAFE"|"TRANSPORTE"} division
 * @param {string} urlPrefix - ej. "/madera" para que los detalles vayan a /madera/<slug>
 * @param {{ categorySlug?: string, variant?: "ecommerce" | "library", filterContainerId?: string }} [options]
 *   filterContainerId: si se pasa, se renderizan botones para filtrar por
 *   `subcategory` (las divisiones internas de Copesa).
 */
export async function renderProductGrid(containerId, division, urlPrefix, options = {}) {
  const { categorySlug, variant = "ecommerce", filterContainerId } = options;
  const divisionSlug = urlPrefix.replace(/^\//, "");
  const grid = document.getElementById(containerId);
  if (!grid) return;

  try {
    const products = await fetchProducts({
      division,
      pageSize: 100,
      ...(categorySlug ? { categorySlug } : {}),
    });

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 border-2 border-dashed border-gray-200">
          <p class="text-gray-400 font-body">No hay productos disponibles en esta división por el momento.</p>
        </div>
      `;
      return;
    }

    // Filtro por categoría/subcategoría. El campo `subcategory` puede ser:
    //   "Categoría"            → un solo nivel (ej. Copesa: "Productos Procesados…")
    //   "Categoría|Subcategoría" → dos niveles (ej. Aserradero: "Muebles de Madera|Puertas")
    const filterEl = filterContainerId ? document.getElementById(filterContainerId) : null;
    const parse = (s) => {
      const [cat, sub] = String(s || "").split("|");
      return { cat: cat || "", sub: sub || "" };
    };
    const categories = [...new Set(products.map((p) => parse(p.subcategory).cat).filter(Boolean))];

    if (filterEl && categories.length > 1) {
      const btnClass =
        "filter-btn border-2 px-4 py-2 font-ui font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer";
      const subBtnClass =
        "subfilter-btn border px-3 py-1.5 font-ui font-semibold text-[11px] tracking-wide transition-colors cursor-pointer";

      const styleActive = (btn, active, primary) => {
        btn.classList.toggle("bg-[#1d4c74]", active);
        btn.classList.toggle("text-white", active);
        btn.classList.toggle("bg-white", !active);
        btn.classList.toggle("text-[#1d4c74]", !active);
        if (primary) btn.classList.toggle("border-[#1d4c74]", true);
      };

      // Barra de categorías (nivel 1) + contenedor de subcategorías (nivel 2)
      filterEl.innerHTML = `
        <div class="flex flex-wrap gap-3 justify-center">
          <button type="button" data-cat="" class="${btnClass} border-[#1d4c74] bg-[#1d4c74] text-white">Todos</button>
          ${categories
            .map(
              (c) =>
                `<button type="button" data-cat="${escapeHtml(c)}" class="${btnClass} border-[#1d4c74] bg-white text-[#1d4c74] hover:bg-[#1d4c74]/5">${escapeHtml(c)}</button>`,
            )
            .join("")}
        </div>
        <div data-subfilters class="flex flex-wrap gap-2 justify-center mt-4 hidden"></div>
      `;

      const subWrap = filterEl.querySelector("[data-subfilters]");

      const applyCat = (cat) => {
        // Sub-botones solo si la categoría tiene subcategorías
        const subs = cat
          ? [...new Set(products.filter((p) => parse(p.subcategory).cat === cat).map((p) => parse(p.subcategory).sub).filter(Boolean))]
          : [];
        if (subs.length > 0) {
          subWrap.innerHTML =
            `<button type="button" data-sub="" class="${subBtnClass} border-[#1d4c74] bg-[#1d4c74] text-white">Todos</button>` +
            subs
              .map(
                (s) =>
                  `<button type="button" data-sub="${escapeHtml(s)}" class="${subBtnClass} border-gray-300 bg-white text-gray-600 hover:border-[#1d4c74] hover:text-[#1d4c74]">${escapeHtml(s)}</button>`,
              )
              .join("");
          subWrap.classList.remove("hidden");
          subWrap.querySelectorAll("button").forEach((sb) => {
            sb.addEventListener("click", () => {
              const sub = sb.dataset.sub ?? "";
              subWrap.querySelectorAll("button").forEach((b) => styleActive(b, b === sb, false));
              paint(
                products.filter((p) => {
                  const { cat: pc, sub: ps } = parse(p.subcategory);
                  return pc === cat && (!sub || ps === sub);
                }),
              );
            });
          });
        } else {
          subWrap.innerHTML = "";
          subWrap.classList.add("hidden");
        }
        paint(cat ? products.filter((p) => parse(p.subcategory).cat === cat) : products);
      };

      filterEl.querySelectorAll("[data-cat]").forEach((btn) => {
        btn.addEventListener("click", () => {
          filterEl.querySelectorAll("[data-cat]").forEach((b) => styleActive(b, b === btn, true));
          applyCat(btn.dataset.cat ?? "");
        });
      });
    }

    paint(products);

    /** Pinta el grid con la lista de productos indicada */
    function paint(list) {
      grid.innerHTML = list
      .map((p) => {
        const img = p.images?.find((i) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? "";
        const detailUrl = buildDetailUrl(urlPrefix, divisionSlug, p.slug);

        if (variant === "library") {
          // Estilo enciclopédico tipo COPESA / Litorsa
          const subtitle = p.shortDesc ?? "";
          const sci = p.scientificName ? `<p class="text-xs italic text-[#1d4c74] font-body mb-3">${escapeHtml(p.scientificName)}</p>` : "";
          return `
            <div class="bg-white border border-gray-200 group hover:shadow-lg transition-shadow flex flex-col">
              <div class="aspect-square overflow-hidden bg-gray-100">
                ${
                  img
                    ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
                    : `<div class="w-full h-full flex items-center justify-center bg-gray-100"><div class="w-12 h-12 border-2 border-gray-300 border-dashed"></div></div>`
                }
              </div>
              <div class="p-6 flex flex-col flex-grow text-center">
                <h3 class="font-display font-bold text-lg text-[#2a3035] leading-tight mb-1">${escapeHtml(p.title)}</h3>
                ${sci}
                <p class="text-sm text-gray-500 font-body mb-5 line-clamp-2">${escapeHtml(subtitle)}</p>
                <a href="${detailUrl}" class="mt-auto inline-block border-2 border-[#1d4c74] text-[#1d4c74] hover:bg-[#1d4c74] hover:text-white font-bold font-ui text-sm px-6 py-2 transition-colors self-center">
                  Más info
                </a>
              </div>
            </div>
          `;
        }

        // Estilo ecommerce por defecto
        const subtitle = p.specs ?? p.shortDesc ?? "";
        return `
          <div class="bg-white border border-gray-200 group hover:border-[#1d4c74] transition-colors flex flex-col">
            <div class="h-48 overflow-hidden bg-gray-100">
              ${
                img
                  ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
                  : `<div class="w-full h-full flex items-center justify-center bg-gray-100"><div class="w-12 h-12 border-2 border-gray-300 border-dashed"></div></div>`
              }
            </div>
            <div class="p-6 flex flex-col flex-grow">
              <h3 class="font-display font-bold text-[#2a3035] leading-tight mb-2">${escapeHtml(p.title)}</h3>
              <p class="text-sm text-gray-500 font-body mb-6 line-clamp-2">${escapeHtml(subtitle)}</p>
              <div class="flex justify-between items-center text-xs font-bold text-gray-400 mt-auto pt-4 border-t border-gray-100">
                <span>Ref: ${escapeHtml(p.ref)}</span>
                <a href="${detailUrl}" class="text-[#1d4c74] hover:text-[#153a5b] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Detalles ${ARROW_SVG}
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
    }
  } catch (err) {
    console.error(`Error al cargar productos (${division}):`, err);
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 bg-red-50 border-l-4 border-red-500">
        <p class="text-red-700 font-body mb-3">No pudimos cargar el catálogo en este momento.</p>
        <button onclick="location.reload()" class="text-sm text-[#1d4c74] underline font-bold cursor-pointer">
          Reintentar
        </button>
      </div>
    `;
  }
}

/**
 * Esqueletos de carga (placeholder) para mostrar mientras llega la respuesta.
 */
export function renderSkeleton(containerId, count = 4) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="bg-white border border-gray-200 flex flex-col animate-pulse">
        <div class="h-48 bg-gray-200"></div>
        <div class="p-6 flex-grow">
          <div class="h-4 bg-gray-200 mb-2 w-3/4"></div>
          <div class="h-3 bg-gray-100 w-1/2 mb-6"></div>
          <div class="h-3 bg-gray-100 w-full pt-4 border-t border-gray-100"></div>
        </div>
      </div>
    `,
    )
    .join("");
}
