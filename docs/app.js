(function () {
  const soldData = window.SOLD_LAND_DATA || { meta: {}, records: [] };
  const activeData = window.ACTIVE_LAND_DATA || { meta: {}, records: [] };

  const soldRecords = (soldData.records || []).map((record) => ({
    ...record,
    id: "sold-" + record.id,
    status: "sold",
    displayPrice: record.soldPrice,
    accuracy: record.geometry ? "parcel matched" : "unmatched parcel",
  }));
  const activeRecords = (activeData.records || []).map((record) => ({
    ...record,
    id: "active-" + record.id,
    status: "active",
    displayPrice: record.listPrice,
  }));
  const allGeocoded = soldRecords.concat(activeRecords).filter((record) => {
    return Number.isFinite(record.lat) && Number.isFinite(record.lng);
  });

  const els = {
    map: document.getElementById("map"),
    status: document.getElementById("dataStatus"),
    dataset: document.getElementById("datasetMode"),
    search: document.getElementById("searchInput"),
    minAcres: document.getElementById("minAcres"),
    maxAcres: document.getElementById("maxAcres"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
    colorMetric: document.getElementById("colorMetric"),
    visibleCount: document.getElementById("visibleCount"),
    medianPrice: document.getElementById("medianPrice"),
    medianPpa: document.getElementById("medianPpa"),
    activeCount: document.getElementById("activeCount"),
    details: document.getElementById("detailPanel"),
    results: document.getElementById("resultsList"),
    clear: document.getElementById("clearFilters"),
    fit: document.getElementById("fitVisible"),
    basemap: document.getElementById("basemapSelect"),
    toggleHeat: document.getElementById("toggleHeat"),
    togglePoints: document.getElementById("togglePoints"),
    toggleParcels: document.getElementById("toggleParcels"),
    resultsTitle: document.getElementById("resultsTitle"),
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
  let filtered = [];
  let selectedId = null;

  const palette = {
    sold: {
      base: "#c75b12",
      low: "#f4b942",
      high: "#a4281f",
      heatInner: "rgba(198, 78, 24, ",
      heatOuter: "rgba(244, 185, 66, ",
    },
    active: {
      base: "#1b7f9c",
      low: "#55c2c3",
      high: "#124f72",
      heatInner: "rgba(18, 112, 161, ",
      heatOuter: "rgba(85, 194, 195, ",
    },
  };

  const HeatCanvasLayer = L.Layer.extend({
    initialize() {
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
      const radius = Math.max(25, Math.min(66, zoom * 4));
      const blur = radius * 0.6;

      this.records.forEach((record) => {
        const point = this.map.latLngToContainerPoint([record.lat, record.lng]);
        if (point.x < -radius || point.y < -radius || point.x > size.x + radius || point.y > size.y + radius) {
          return;
        }

        const colors = palette[record.status] || palette.sold;
        const intensity = record.heatIntensity || 0.35;
        const gradient = this.context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius + blur);
        gradient.addColorStop(0, colors.heatInner + 0.34 * intensity + ")");
        gradient.addColorStop(0.42, colors.heatOuter + 0.20 * intensity + ")");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

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

  function recordsForMode() {
    if (els.dataset.value === "sold") return soldRecords.filter((record) => Number.isFinite(record.lat) && Number.isFinite(record.lng));
    if (els.dataset.value === "active") return activeRecords.filter((record) => Number.isFinite(record.lat) && Number.isFinite(record.lng));
    return allGeocoded;
  }

  function priceFor(record) {
    return record.status === "active" ? record.listPrice : record.soldPrice;
  }

  function metricValue(record) {
    if (els.colorMetric.value === "displayPrice") return Number(priceFor(record));
    return Number(record[els.colorMetric.value]);
  }

  function colorFor(record) {
    const colors = palette[record.status] || palette.sold;
    if (els.dataset.value === "both") return colors.base;

    const values = filtered.map(metricValue).filter(Number.isFinite);
    if (!values.length) return colors.base;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const value = metricValue(record);
    const ratio = max === min || !Number.isFinite(value) ? 0.5 : (value - min) / (max - min);
    if (ratio < 0.35) return colors.low;
    if (ratio < 0.72) return colors.base;
    return colors.high;
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
        status: record.status,
        heatIntensity: Math.max(0.24, Math.min(1, 0.24 + ratio * 0.76)),
      };
    });
  }

  function radiusFor(record) {
    const acres = Number(record.acres);
    if (!Number.isFinite(acres)) return 8;
    return Math.max(8, Math.min(25, 7 + Math.sqrt(acres) * 2.25));
  }

  function searchableText(record) {
    return [
      record.status,
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
    const price = priceFor(record);

    if (term && !searchableText(record).includes(term)) return false;
    if (minAcres !== null && record.acres < minAcres) return false;
    if (maxAcres !== null && record.acres > maxAcres) return false;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;
    return true;
  }

  function popupHtml(record) {
    return [
      '<strong><span class="status-dot ' + record.status + '"></span>' + html(record.mls) + "</strong>",
      "<div>" + html(record.location) + "</div>",
      "<div>" + (record.status === "active" ? "List " : "Sold ") + money(priceFor(record)) + " / " + number.format(record.acres || 0) + " ac</div>",
      "<div>" + money(record.pricePerAcre) + " per acre</div>",
      record.status === "active" ? '<div class="accuracy-note">' + html(record.accuracy) + "</div>" : "",
    ].join("");
  }

  function polygonCoords(record) {
    if (!record.geometry || record.geometry.type !== "Polygon") return null;
    return record.geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
  }

  function selectRecord(record, options = {}) {
    selectedId = record.id;
    const priceLabel = record.status === "active" ? "List price" : "Sold price";
    const title = record.propertyAddress && record.propertyAddress.trim() ? record.propertyAddress : record.location;
    els.details.innerHTML = [
      '<article class="detail-card">',
      '<div class="detail-title"><strong><span class="status-pill ' + record.status + '">' + html(record.status) + "</span>" + html(record.mls) + "</strong><span>" + html(title) + "</span></div>",
      '<div class="detail-grid">',
      "<div><span>" + priceLabel + "</span><strong>" + money(priceFor(record)) + "</strong></div>",
      "<div><span>Price/acre</span><strong>" + money(record.pricePerAcre) + "</strong></div>",
      "<div><span>Acres</span><strong>" + number.format(record.acres || 0) + "</strong></div>",
      "<div><span>DOM</span><strong>" + html(record.daysOnMarket) + "</strong></div>",
      "<div><span>PIN</span><strong>" + html(record.pin) + "</strong></div>",
      "<div><span>Zoning</span><strong>" + html(record.zoning) + "</strong></div>",
      "<div><span>Position</span><strong>" + html(record.accuracy) + "</strong></div>",
      "</div>",
      '<div><span class="remarks-label">Remarks</span><p class="remarks">' + html(record.remarks) + "</p></div>",
      "</article>",
    ].join("");

    rowById.forEach((row) => row.classList.toggle("active", row.dataset.id === record.id));
    markerById.forEach((marker, id) => {
      const el = marker.getElement();
      if (el) el.style.outline = id === record.id ? "3px solid rgba(23, 33, 43, 0.45)" : "";
    });

    if (options.pan !== false) {
      map.setView([record.lat, record.lng], Math.max(map.getZoom(), 13), { animate: true });
    }
  }

  function markerHtml(record, color, radius) {
    const size = radius * 2;
    if (record.status === "active") {
      return '<span class="land-marker active-marker" style="width:' + size + "px;height:" + size + "px;background:" + color + '"></span>';
    }
    return '<span class="land-marker sold-marker" style="width:' + size + "px;height:" + size + "px;background:" + color + '"></span>';
  }

  function renderMap() {
    pointLayer.clearLayers();
    parcelLayer.clearLayers();
    markerById.clear();

    filtered.forEach((record) => {
      const color = colorFor(record);
      const radius = radiusFor(record);
      const marker = L.marker([record.lat, record.lng], {
        icon: L.divIcon({
          className: "land-marker-wrap",
          html: markerHtml(record, color, radius),
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        }),
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
          fillOpacity: record.status === "sold" ? 0.13 : 0.09,
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
      .sort((a, b) => (priceFor(b) || 0) - (priceFor(a) || 0))
      .forEach((record) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "result-row " + record.status;
        row.dataset.id = record.id;
        row.innerHTML = [
          '<span class="result-main"><strong><span class="status-dot ' + record.status + '"></span>' + html(record.propertyAddress || record.location) + "</strong>",
          "<span>" + html(record.mls) + " | " + html(record.status) + " | " + html(record.accuracy) + "</span></span>",
          '<span class="result-meta">' + money(priceFor(record)) + "<br>" + number.format(record.acres || 0) + " ac</span>",
        ].join("");
        row.addEventListener("click", () => selectRecord(record));
        els.results.appendChild(row);
        rowById.set(record.id, row);
      });
  }

  function renderSummary() {
    const activeVisible = filtered.filter((record) => record.status === "active").length;
    const soldVisible = filtered.filter((record) => record.status === "sold").length;
    els.visibleCount.textContent = String(filtered.length);
    els.medianPrice.textContent = money(median(filtered.map(priceFor)));
    els.medianPpa.textContent = money(median(filtered.map((record) => record.pricePerAcre)));
    els.activeCount.textContent = activeVisible + " active / " + soldVisible + " sold";
  }

  function fitVisible() {
    if (!filtered.length) return;
    const bounds = L.latLngBounds(filtered.map((record) => [record.lat, record.lng]));
    map.fitBounds(bounds.pad(0.08));
  }

  function renderStatus() {
    const missingSold = (soldData.meta.missingPins || []).length;
    els.status.innerHTML =
      soldData.meta.recordCount +
      " sold rows, " +
      soldData.meta.geocodedCount +
      " parcel matched. " +
      activeData.meta.recordCount +
      " active rows, " +
      activeData.meta.exactCoordinateCount +
      " exact coordinate and " +
      activeData.meta.approximateCoordinateCount +
      ' approximate. <span class="missing-note">' +
      missingSold +
      " sold PINs need review.</span>";
  }

  function updateLabels() {
    const mode = els.dataset.value;
    const modeText = mode === "both" ? "Active + Sold" : mode.charAt(0).toUpperCase() + mode.slice(1);
    document.title = modeText + " Land Map";
    els.resultsTitle.textContent = modeText + " Parcels";
    const label = document.getElementById("legendMetric");
    if (label) {
      label.textContent = mode === "both" ? "Active blue diamonds / Sold amber circles" : els.colorMetric.options[els.colorMetric.selectedIndex].textContent;
    }
  }

  function update() {
    filtered = recordsForMode().filter(passesFilters);
    renderMap();
    renderList();
    renderSummary();
    renderStatus();
    updateLabels();
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
    div.innerHTML = [
      '<div class="legend-row"><span class="legend-symbol active"></span><strong>Active</strong></div>',
      '<div class="legend-row"><span class="legend-symbol sold"></span><strong>Sold</strong></div>',
      '<div class="legend-bar"></div><span id="legendMetric">Active blue diamonds / Sold amber circles</span>',
    ].join("");
    return div;
  };
  legend.addTo(map);

  [els.dataset, els.search, els.minAcres, els.maxAcres, els.minPrice, els.maxPrice, els.colorMetric].forEach((input) => {
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });
  els.clear.addEventListener("click", clearFilters);
  els.fit.addEventListener("click", fitVisible);
  els.basemap.addEventListener("change", () => setBasemap(els.basemap.value));
  [els.toggleHeat, els.togglePoints, els.toggleParcels].forEach((toggle) => {
    toggle.addEventListener("change", renderMap);
  });

  update();
  fitVisible();
})();
