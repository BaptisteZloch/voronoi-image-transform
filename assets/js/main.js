"use strict";
const body = document.body;
let w,
  h,
  indata,
  bwdata,
  xy = [];
let lastw, lasth;

img.addEventListener("load", imageLoaded, false);
let inverse = false;

function imageLoaded() {
  w = img.naturalWidth;
  h = img.naturalHeight;
  resize(inp, w, h);
  resize(out, 1024, (1024 * h) / w);
  scale.value = 200 / w;
  let ctx = inp.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0);
  indata = ctx.getImageData(0, 0, w, h).data;
  resize(grayscale, w, h);
  updateBW();
}

function invertImage(imgData) {
  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = 255 - imgData.data[i];
    imgData.data[i + 1] = 255 - imgData.data[i + 1];
    imgData.data[i + 2] = 255 - imgData.data[i + 2];
    imgData.data[i + 3] = 255;
  }
  return imgData;
}

function updateBW(inv = false) {
  let ctx = grayscale.getContext("2d"),
    idata = ctx.getImageData(0, 0, w, h),
    bwdata = idata.data,
    gray;
  ctx.filter = "invert(1)";
  let r = rv.valueAsNumber,
    g = gv.valueAsNumber,
    b = bv.valueAsNumber,
    s = r + g + b;
  for (let o = 0; o < bwdata.length; o += 4) {
    gray = Math.floor(
      (indata[o] * r + indata[o + 1] * g + indata[o + 2] * b) / s
    );
    bwdata[o] = bwdata[o + 1] = bwdata[o + 2] = gray;
    bwdata[o + 3] = indata[o + 3];
  }
  if (inverse) {
    idata = invertImage(idata);
  }
  ctx.putImageData(idata, 0, 0);
  updateBitmap();
}

function updateBitmap() {
  let bw = Math.round((w * scale.value) / 15),
    bh = Math.round((h * scale.value) / 15);
  console.log("dim", bw, bh);
  if (bw !== lastw || bh !== lasth) {
    resize(bit, bw, bh);
    lastw = bw;
    lasth = bh;
  }

  xy.length = 0;

  let ctx = bit.getContext("2d");
  ctx.drawImage(grayscale, 0, 0, bw, bh);
  let idata = ctx.getImageData(0, 0, bw, bh),
    bitdata = idata.data;
  ctx.clearRect(0, 0, bw, bh);
  for (let o = 0; o < bitdata.length; o += 4) {
    let x = (o / 4) % bw;
    let y = Math.floor(o / 4 / bw);
    let on =
      bitdata[o + 3] > 20 &&
      Math.random() * 255 > bitdata[o] + light.valueAsNumber;
    bitdata[o] = bitdata[o + 1] = bitdata[o + 2] = on ? 0 : 255;
    bitdata[o + 3] = 255;
    if (on)
      xy.push({
        x: x / bw + Math.random() / 200,
        y: y / bh + Math.random() / 200,
      });
  }
  ctx.putImageData(idata, 0, 0);
  calculateVoronoi();
}

function calculateVoronoi() {
  const voronoi = new Voronoi();
  const bbox = { xl: 0, xr: out.width, yt: 0, yb: out.height };
  const diagram = voronoi.compute(xy, bbox);

  let ctx = out.getContext("2d");
  ctx.clearRect(0, 0, out.width, out.height);
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 0.8;

  diagram.edges.forEach((e) => {
    ctx.beginPath();
    ctx.moveTo(e.va.x * out.width, e.va.y * out.height);
    ctx.lineTo(e.vb.x * out.width, e.vb.y * out.height);
    ctx.stroke();
  });
}

rv.addEventListener("change", updateBW, false);
gv.addEventListener("change", updateBW, false);
bv.addEventListener("change", updateBW, false);
iv.addEventListener(
  "change",
  (event) => {
    inverse = !inverse;
    updateBW(inverse);
  },
  false
);

scale.addEventListener("change", updateBitmap, false);
light.addEventListener("change", updateBitmap, false);

body.addEventListener("dragenter", over, false);
body.addEventListener("dragover", over, false);
body.addEventListener("dragleave", stop, false);
body.addEventListener(
  "drop",
  (e) => {
    stop(e);
    const file = e.dataTransfer.files[0];
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },
  false
);
function over(e) {
  nope(e);
  body.classList.add("hover");
}
function stop(e) {
  nope(e);
  body.classList.remove("hover");
}
function nope(e) {
  e.stopPropagation();
  e.preventDefault();
}
function resize(o, w, h) {
  o.width = w;
  o.height = h;
}

function downloadResult() {
  let link = document.createElement("a");
  link.download = `voronoi-${new Date().toISOString()}.png`;
  link.href = out.toDataURL("image/png");
  link.click();
  link.download = `voronoi-${new Date().toISOString()}.svg`;
  link.href = out.toDataURL("image/svg+xml");
  link.click();
}
