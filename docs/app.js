(function () {
  const data = window.SOLD_LAND_DATA || { meta: {}, records: [] };
  const records = data.records || [];
  const geocoded = records.filter((record) => Number.isFinite(record.lat) && Number.isFinite(record.lng));

  const els = {
    map: document.getElementById("map"),
    status: document.getElementById("dataStatus"),
    search: document.getElementById("searchInput"),
    minAcres: document.getElementById("minAcres"),
    maxAcres: document.getElementById("maxAcres"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
    colorMetric: document.getElementById("colorMetric"),
    visibleCount: document.getElementById("visibleCount"),
    medianPrice: document.getElementById("medianPrice"),
    medianPpa: document.getElementById("medianPpa"),
    details: document.getElementById("detailPanel"),
    results: document.getElementById("resultsList"),
    clear: document.getElementById("clearFilters"),
    fit: document.getElementById("fitVisible"),
    basemap: document.getElementById("basemapSelect"),
    toggleHeat: document.getElementById("toggleHeat"),
    togglePoints: document.getElementById("togglePoints"),
    toggleParcels: document.getElementById("toggleParcels"),
  };

  const map = L.map(els.map, { zoomControl: false });
  L.control.zoom({ position: "bottomleft" }).addTo(map);
  const baseLayers = {
    street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }),
    satellite: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri",
      },
    ),
  };
  let activeBaseLayer = baseLayers.street.addTo(map);

  const pointLayer = L.layerGroup().addTo(map);
  const parcelLayer = L.layerGroup();
  const markerById = new Map();
  const rowById = new Map();
  let filtered = geocoded.slice();
  let selectedId = null;

  const HeatCanvasLayer = L.Layer.extend({
    initialize(options = {}) {
      this.options = options;
      this.records = [];
    },

    onAdd(activeMap) {
      this.map = activeMap;
      this.canvas = L.DomUtil.create("canvas", "heat-canvas leaflet-zoom-animated");
      this.context = this.canvas.getContext("2d");
      activeMap.getPanes().overlayPane.appendChild(this.canvas);
      activeMap.on("move zoom resize viewreset", this.redraw, this);
      this.redraw();
    },

    onRemove(activeMap) {
      activeMap.off("move zoom resize viewreset", this.redraw, this);
      L.DomUtil.remove(this.canvas);
    },

    setRecords(recordsForHeat) {
      this.records = recordsForHeat;
      this.redraw();
    },

    redraw() {
      if (!this.map || !this.canvas) return;

      const size = this.map.getSize();
      const topLeft = this.map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this.canvas, topLeft);
      this.canvas.width = size.x;
      this.canvas.height = size.y;
      this.context.clearRect(0, 0, size.x, size.y);

      if (!this.records.length) return;

      const zoom = this.map.getZoom();
      const radius = Math.max(26, Math.min(68, zoom * 4.1));
      const blur = radius * 0.65;

      this.records.forEach((record) => {
        const point = this.map.latLngToContainerPoint([record.lat, record.lng]);
        if (point.x < -radius || point.y < -radius || point.x > size.x + radius || point.y > size.y + radius) {
          return;
        }

        const intensity = record.heatIntensity || 0.35;
        const gradient = this.context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius + blur);
        gradient.addColorStop(0, "rgba(178, 24, 43, " + 0.32 * intensity + ")");
        gradient.addColorStop(0.32, "rgba(217, 95, 2, " + 0.24 * intensity + ")");
        gradient.addColorStop(0.62, "rgba(244, 211, 94, " + 0.14 * intensity + ")");
        gradient.addColorStop(1, "rgba(44, 123, 182, 0)");

        this.context.fillStyle = gradient;
        this.context.beginPath();
        this.context.arc(point.x, point.y, radius + blur, 0, Math.PI * 2);
        this.context.fill();
      });
    },
  });

  const heatLayer = new HeatCanvasLayer();
  heatLayer.addTo(map);

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

  function money(value) {
    return Number.isFinite(value) ? currency.format(value) : "N/A";
  }

  function plain(value) {
    return value === null || value === undefined || value === "" ? "N/A" : String(value);
  }

  function html(value) {
    return plain(value).replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function numericInput(input) {
    const value = Number(input.value);
    return Number.isFinite(value) && input.value !== "" ? value : null;
  }

  function median(values) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function metricValue(record) {
    return Number(record[els.colorMetric.value]);
  }

  function colorFor(record) {
    const values = filtered.map(metricValue).filter(Number.isFinite);
    if (!values.length) return "#1c7c6e";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const value = metricValue(record);
    const ratio = max === min || !Number.isFinite(value) ? 0.5 : (value - min) / (max - min);
    if (ratio < 0.2) return "#2c7bb6";
    if (ratio < 0.4) return "#00a676";
    if (ratio < 0.6) return "#f4d35e";
    if (ratio < 0.8) return "#d95f02";
    return "#b2182b";
  }

  function heatRecords() {
    const values = filtered.map(metricValue).filter(Number.isFinite).sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    return filtered.map((record) => {
      const value = metricValue(record);
      const ratio = max === min || !Number.isFinite(value) ? 0.55 : (value - min) / (max - min);
      return {
        lat: record.lat,
        lng: record.lng,
        heatIntensity: Math.max(0.25, Math.min(1, 0.25 + ratio * 0.75)),
      };
    });
  }

  function radiusFor(record) {
    const acres = Number(record.acres);
    if (!Number.isFinite(acres)) return 8;
    return Math.max(8, Math.min(26, 7 + Math.sqrt(acres) * 2.4));
  }

  function searchableText(record) {
    return [
      record.mls,
      record.pin,
      record.location,
      record.zoning,
      record.propertyAddress,
      record.municipality,
      record.remarks,
    ].join(" ").toLowerCase();
  }

  function passesFilters(record) {
    const term = els.search.value.trim().toLowerCase();
    const minAcres = numericInput(els.minAcres);
    const maxAcres = numericInput(els.maxAcres);
    const minPrice = numericInput(els.minPrice);
    const maxPrice = numericInput(els.maxPrice);

    if (term && !searchableText(record).includes(term)) return false;
    if (minAcres !== null && record.acres < minAcres) return false;
    if (maxAcres !== null && record.acres > maxAcres) return false;
    if (minPrice !== null && record.soldPrice < minPrice) return false;
    if (maxPrice !== null && record.soldPrice > maxPrice) return false;
    return true;
  }

  function popupHtml(record) {
    return [
      "<strong>" + html(record.mls) + "</strong>",
      "<div>" + html(record.location) + "</div>",
      "<div>" + money(record.soldPrice) + " / " + number.format(record.acres || 0) + " ac</div>",
      "<div>" + money(record.pricePerAcre) + " per acre</div>",
    ].join("");
  }

  function polygonCoords(record) {
    if (!record.geometry || record.geometry.type !== "Polygon") return null;
    return record.geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
  }

  function selectRecord(record, options = {}) {
    selectedId = record.id;
    els.details.innerHTML = [
      '<article class="detail-card">',
      '<div class="detail-title"><strong>' + html(record.mls) + "</strong><span>" + html(record.propertyAddress || record.location) + "</span></div>",
      '<div class="detail-grid">',
      "<div><span>Sold price</span><strong>" + money(record.soldPrice) + "</strong></div>",
      "<div><span>Price/acre</span><strong>" + money(record.pricePerAcre) + "</strong></div>",
      "<div><span>Acres</span><strong>" + number.format(record.acres || 0) + "</strong></div>",
      "<div><span>DOM</span><strong>" + html(record.daysOnMarket) + "</strong></div>",
      "<div><span>PIN</span><strong>" + html(record.pin) + "</strong></div>",
      "<div><span>Zoning</span><strong>" + html(record.zoning) + "</strong></div>",
      "</div>",
      '<div><span class="remarks-label">Remarks</span><p class="remarks">' + html(record.remarks) + "</p></div>",
      "</article>",
    ].join("");

    rowById.forEach((row) => row.classList.toggle("active", Number(row.dataset.id) === record.id));
    markerById.forEach((marker, id) => {
      const el = marker.getElement();
      if (el) el.style.outline = id === record.id ? "3px solid rgba(23, 33, 43, 0.45)" : "";
    });

    if (options.pan !== false) {
      map.setView([record.lat, record.lng], Math.max(map.getZoom(), 13), { animate: true });
    }
  }

  function renderMap() {
    pointLayer.clearLayers();
    parcelLayer.clearLayers();
    markerById.clear();

    filtered.forEach((record) => {
      const color = colorFor(record);
      const radius = radiusFor(record);
      const marker = L.circleMarker([record.lat, record.lng], {
        radius,
        color: "#ffffff",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.88,
        className: "sold-marker",
      })
        .bindPopup(popupHtml(record))
        .on("click", () => selectRecord(record, { pan: false }));
      marker.addTo(pointLayer);
      markerById.set(record.id, marker);

      const coords = polygonCoords(record);
      if (coords) {
        L.polygon(coords, {
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.14,
        })
          .on("click", () => selectRecord(record))
          .addTo(parcelLayer);
      }
    });

    heatLayer.setRecords(heatRecords());
    if (els.togglePoints.checked && !map.hasLayer(pointLayer)) pointLayer.addTo(map);
    if (!els.togglePoints.checked && map.hasLayer(pointLayer)) map.removeLayer(pointLayer);
    if (els.toggleHeat.checked && !map.hasLayer(heatLayer)) heatLayer.addTo(map);
    if (!els.toggleHeat.checked && map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    if (els.toggleParcels.checked && !map.hasLayer(parcelLayer)) parcelLayer.addTo(map);
    if (!els.toggleParcels.checked && map.hasLayer(parcelLayer)) map.removeLayer(parcelLayer);
  }

  function renderList() {
    rowById.clear();
    els.results.innerHTML = "";
    filtered
      .slice()
      .sort((a, b) => b.soldPrice - a.soldPrice)
      .forEach((record) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "result-row";
        row.dataset.id = record.id;
        row.innerHTML = [
          '<span class="result-main"><strong>' + html(record.propertyAddress || record.location) + "</strong>",
          "<span>" + html(record.mls) + " | " + html(record.pin) + "</span></span>",
          '<span class="result-meta">' + money(record.soldPrice) + "<br>" + number.format(record.acres || 0) + " ac</span>",
        ].join("");
        row.addEventListener("click", () => selectRecord(record));
        els.results.appendChild(row);
        rowById.set(record.id, row);
      });
  }

  function renderSummary() {
    els.visibleCount.textContent = String(filtered.length);
    els.medianPrice.textContent = money(median(filtered.map((record) => record.soldPrice)));
    els.medianPpa.textContent = money(median(filtered.map((record) => record.pricePerAcre)));
  }

  function fitVisible() {
    if (!filtered.length) return;
    const bounds = L.latLngBounds(filtered.map((record) => [record.lat, record.lng]));
    map.fitBounds(bounds.pad(0.08));
  }

  function update() {
    filtered = geocoded.filter(passesFilters);
    renderMap();
    renderList();
    renderSummary();
    if (selectedId) {
      const selected = filtered.find((record) => record.id === selectedId);
      if (selected) selectRecord(selected, { pan: false });
    }
  }

  function clearFilters() {
    [els.search, els.minAcres, els.maxAcres, els.minPrice, els.maxPrice].forEach((input) => {
      input.value = "";
    });
    update();
    fitVisible();
  }

  function setBasemap(name) {
    const nextLayer = baseLayers[name] || baseLayers.street;
    if (nextLayer === activeBaseLayer) return;
    map.removeLayer(activeBaseLayer);
    activeBaseLayer = nextLayer.addTo(map);
    activeBaseLayer.bringToBack();
    heatLayer.redraw();
  }

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-control legend");
    div.innerHTML = '<strong>Low to high</strong><div class="legend-bar"></div><span id="legendMetric">Sold price</span>';
    return div;
  };
  legend.addTo(map);

  els.status.innerHTML =
    data.meta.recordCount +
    " sold land rows. " +
    data.meta.geocodedCount +
    ' matched to parcel geometry. <span class="missing-note">' +
    (data.meta.missingPins || []).length +
    " need review.</span>";

  [els.search, els.minAcres, els.maxAcres, els.minPrice, els.maxPrice, els.colorMetric].forEach((input) => {
    input.addEventListener("input", update);
  });
  els.clear.addEventListener("click", clearFilters);
  els.fit.addEventListener("click", fitVisible);
  els.basemap.addEventListener("change", () => setBasemap(els.basemap.value));
  [els.toggleHeat, els.togglePoints, els.toggleParcels].forEach((toggle) => {
    toggle.addEventListener("change", renderMap);
  });
  els.colorMetric.addEventListener("change", () => {
    const selected = els.colorMetric.options[els.colorMetric.selectedIndex].textContent;
    const label = document.getElementById("legendMetric");
    if (label) label.textContent = selected;
  });

  update();
  fitVisible();
})();
