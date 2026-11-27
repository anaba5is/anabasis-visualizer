const RADIANS = Math.PI / 180;
// Natural Earth shaded relief and physical vectors, public domain. The global
// texture uses 1:50m data. The regional texture uses 1:10m data at native relief
// resolution, with a finer shoreline mask in the alpha channel.
const smallScreen = globalThis.matchMedia?.('(max-width: 52rem)').matches;
const COMPACT_TEXTURE_URL = new URL('./assets/globe-relief-compact.webp', import.meta.url).href;
const TEXTURE_URL = new URL('./assets/globe-relief.webp', import.meta.url).href;
const REGIONAL_TEXTURE_URL = new URL('./assets/globe-detail.webp', import.meta.url).href;
// West, south, east, north. This is the crop in scripts/build-globe-detail.py.
const REGIONAL_BOUNDS = [20, 25, 52, 47];
const DETAIL_MIN_RADIUS = 450;
const DETAIL_FULL_RADIUS = 1000;
const DETAIL_BLEND_DEGREES = 2.2;
const HALO_RATIO = .085;
const HALO_PIXELS = 36;
const SHADE = {
  atmosphere: [57, 102, 121],
  atmosphereLight: [41, 48, 43],
  ocean: [15, 31, 40],
  oceanCenter: [12, 23, 25],
  oceanLight: [3, 8, 12],
  land: [89, 84, 74],
  landLight: [118, 105, 79],
};

const shaderColor = values => `vec3(${values.map(channel => (channel / 255).toFixed(6)).join(', ')})`;

function projectPoint([longitude, latitude], lon, sinCenter, cosCenter, x, y, radius) {
  const lat = latitude * RADIANS;
  const lonDelta = (longitude - lon) * RADIANS;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const meridian = cosLat * Math.cos(lonDelta);
  const depth = sinCenter * sinLat + cosCenter * meridian;

  return {
    x: x + radius * cosLat * Math.sin(lonDelta),
    y: y - radius * (cosCenter * sinLat - sinCenter * meridian),
    visible: depth > 0,
    depth,
  };
}

export function project(point, { lon, lat, x, y, radius }) {
  const center = lat * RADIANS;
  return projectPoint(point, lon, Math.sin(center), Math.cos(center), x, y, radius);
}

export function createProjector({ lon, lat, x, y, radius }) {
  const center = lat * RADIANS;
  const sinCenter = Math.sin(center);
  const cosCenter = Math.cos(center);
  return point => projectPoint(point, lon, sinCenter, cosCenter, x, y, radius);
}

const [WEST, SOUTH, EAST, NORTH] = REGIONAL_BOUNDS;
const regionCenter = { lon: (WEST + EAST) / 2, lat: (SOUTH + NORTH) / 2 };
const regionProject = createProjector({ ...regionCenter, x: 0, y: 0, radius: 1 });
const regionAngularRadius = Math.max(...[
  [WEST, SOUTH], [WEST, NORTH], [EAST, SOUTH], [EAST, NORTH],
].map(point => Math.acos(regionProject(point).depth)));

function needsRegionalTexture(camera) {
  // Fetch ahead of the detail transition while zooming. A globe fully inside
  // the viewport and a close view on the other side of Earth use the base map.
  const scale = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (camera.radius * scale < DETAIL_MIN_RADIUS * .72
      || camera.radius <= Math.min(camera.width, camera.height) * .55) return false;
  const maxOffsetX = Math.max(Math.abs(camera.x), Math.abs(camera.width - camera.x));
  const maxOffsetY = Math.max(Math.abs(camera.y), Math.abs(camera.height - camera.y));
  const viewingAngle = Math.asin(Math.min(1, Math.hypot(maxOffsetX, maxOffsetY) / camera.radius));
  const cropCenter = project([regionCenter.lon, regionCenter.lat], camera);
  return cropCenter.depth >= Math.cos(viewingAngle + regionAngularRadius);
}

function basis({ lon, lat }) {
  const longitude = lon * RADIANS;
  const latitude = lat * RADIANS;
  const cosLon = Math.cos(longitude);
  const sinLon = Math.sin(longitude);
  const cosLat = Math.cos(latitude);
  const sinLat = Math.sin(latitude);
  return {
    east: [-sinLon, 0, cosLon],
    north: [-sinLat * cosLon, cosLat, -sinLat * sinLon],
    center: [cosLat * cosLon, sinLat, cosLat * sinLon],
  };
}

const vertexShaderSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShaderSource = `
precision highp float;
uniform sampler2D earth;
uniform sampler2D regionalEarth;
uniform bool regionalLoaded;
uniform bool terrainEnabled;
uniform vec4 regionalBounds;
uniform float height;
uniform vec2 origin;
uniform vec2 radius;
uniform vec3 east;
uniform vec3 north;
uniform vec3 center;

const float PI = 3.141592653589793;
const vec3 atmosphere = ${shaderColor(SHADE.atmosphere)};
const vec3 atmosphereLight = ${shaderColor(SHADE.atmosphereLight)};
const vec3 incidentLight = vec3(-0.49, 0.56, 0.67);

void main() {
  vec2 point = (vec2(gl_FragCoord.x, height - gl_FragCoord.y) - origin) / radius;
  point.y *= -1.0;
  float edge = length(point);
  float softness = 1.3 / min(radius.x, radius.y);
  float skyLight = clamp(dot(point, incidentLight.xy), 0.0, 1.0);
  vec3 sky = atmosphere + skyLight * atmosphereLight;

  if (edge > 1.0) {
    float haloWidth = min(${HALO_RATIO}, ${HALO_PIXELS}.0 / min(radius.x, radius.y));
    if (edge > 1.0 + haloWidth) {
      gl_FragColor = vec4(0.0);
    } else {
      float alpha = 0.30 * exp(-4.8 * (edge - 1.0) / haloWidth);
      gl_FragColor = vec4(sky * alpha, alpha);
    }
    return;
  }

  float z = sqrt(max(0.0, 1.0 - dot(point, point)));
  vec3 normal = vec3(point, z);
  vec3 world = east * point.x + north * point.y + center * z;
  float longitude = atan(world.z, world.x);
  float latitude = asin(clamp(world.y, -1.0, 1.0));
  vec2 uv = vec2(0.5 + longitude / (2.0 * PI), 0.5 - latitude / PI);
#ifdef EXPLICIT_GRADIENT
  vec2 dx = dFdx(uv);
  vec2 dy = dFdy(uv);
  // Longitude wraps at the antimeridian. Unwrap local derivatives before
  // choosing a mip level so adjacent fragments don't sample the entire globe.
  dx.x -= floor(dx.x + 0.5);
  dy.x -= floor(dy.x + 0.5);
  vec4 sampleColor = texture2DGradEXT(earth, uv, dx, dy);
#else
  vec4 sampleColor = texture2D(earth, uv);
#endif
  float detailZoom = smoothstep(${DETAIL_MIN_RADIUS}.0, ${DETAIL_FULL_RADIUS}.0, min(radius.x, radius.y));
  if (regionalLoaded && detailZoom > 0.0) {
    vec2 geographic = vec2(longitude, latitude) * (180.0 / PI);
    vec2 local = geographic - regionalBounds.xy;
    vec2 span = regionalBounds.zw - regionalBounds.xy;
    vec2 toEdge = min(local, span - local);
    float blend = detailZoom * smoothstep(0.0, ${DETAIL_BLEND_DEGREES}, min(toEdge.x, toEdge.y));
    if (blend > 0.0) {
      vec2 texel = local / span;
      vec4 detail = texture2D(regionalEarth, vec2(texel.x, 1.0 - texel.y));
      sampleColor = mix(sampleColor, detail, blend);
    }
  }

  float illumination = max(0.0, dot(normal, incidentLight));
  float gray = terrainEnabled && sampleColor.a > 0.0 ? sampleColor.r / sampleColor.a : 206.0 / 255.0;
  float landTone = clamp(0.50 + (gray - 0.78) * 2.55, 0.0, 1.0);
  vec3 stone = ${shaderColor(SHADE.land)} + landTone * ${shaderColor(SHADE.landLight)};
  float glint = illumination * illumination;
  vec3 ocean = ${shaderColor(SHADE.ocean)} + z * ${shaderColor(SHADE.oceanCenter)}
    + glint * glint * ${shaderColor(SHADE.oceanLight)};
  vec3 surface = mix(ocean, stone, sampleColor.a) * (0.79 + 0.25 * illumination);

  vec3 color = mix(surface, sky, 0.40 * pow(1.0 - z, 3.1));
  float coverage = 1.0 - 0.70 * smoothstep(1.0 - softness, 1.0, edge);
  gl_FragColor = vec4(color * coverage, coverage);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function drawGlobePixels(gl, width, height, x, y, radiusX, radiusY) {
  const halo = 1 + Math.min(HALO_RATIO, HALO_PIXELS / Math.min(radiusX, radiusY));
  const left = Math.max(0, Math.floor(x - radiusX * halo));
  const right = Math.min(width, Math.ceil(x + radiusX * halo));
  const bottom = Math.max(0, Math.floor(height - y - radiusY * halo));
  const top = Math.min(height, Math.ceil(height - y + radiusY * halo));
  if (left === 0 && right === width && bottom === 0 && top === height) {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;
  }

  // At globe scale the rest of the viewport is entirely transparent. Skip it
  // rather than running the relief shader and writing all four channels there.
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (right <= left || top <= bottom) return;
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(left, bottom, right - left, top - bottom);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disable(gl.SCISSOR_TEST);
}

function globeClip({ width, height, x, y, radius }, scale) {
  const farX = Math.max(Math.abs(x), Math.abs(width - x));
  const farY = Math.max(Math.abs(y), Math.abs(height - y));
  if (radius >= Math.hypot(farX, farY)) return 'none';

  // The page's clip is independent of the canvas alpha channel. It prevents a
  // compositor from exposing the rectangular framebuffer around the globe.
  const extent = radius + Math.min(radius * HALO_RATIO, HALO_PIXELS / scale) + 1 / scale;
  return `circle(${extent.toFixed(2)}px at ${x.toFixed(2)}px ${y.toFixed(2)}px)`;
}

function createWebGLRenderer(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
  });
  const attributes = gl?.getContextAttributes();
  if (!(attributes?.alpha && attributes.premultipliedAlpha)) return null;

  const explicitGradient = gl.getExtension('OES_standard_derivatives') && gl.getExtension('EXT_shader_texture_lod');
  const extensions = explicitGradient ? `#extension GL_OES_standard_derivatives : enable
#extension GL_EXT_shader_texture_lod : enable
#define EXPLICIT_GRADIENT 1
` : '';
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, extensions + fragmentShaderSource);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);
  gl.clearColor(0, 0, 0, 0);

  const uniforms = Object.fromEntries(
    ['height', 'origin', 'radius', 'east', 'north', 'center', 'regionalLoaded', 'terrainEnabled', 'regionalBounds']
      .map(name => [name, gl.getUniformLocation(program, name)]),
  );
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const earth = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, earth);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.uniform1i(gl.getUniformLocation(program, 'earth'), 0);

  const regionalEarth = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, regionalEarth);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.uniform1i(gl.getUniformLocation(program, 'regionalEarth'), 1);
  gl.uniform4fv(uniforms.regionalBounds, REGIONAL_BOUNDS);
  gl.activeTexture(gl.TEXTURE0);
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  let clip;

  return {
    setImage(image) {
      if (gl.isContextLost()) return;
      const source = fitImage(image, maxTextureSize);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      if (explicitGradient) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      }
    },
    setRegionalImage(image) {
      if (gl.isContextLost()) return;
      gl.activeTexture(gl.TEXTURE1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fitImage(image, maxTextureSize));
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(uniforms.regionalLoaded, 1);
    },
    draw(camera) {
      if (gl.isContextLost()) return false;
      const scale = Math.min(globalThis.devicePixelRatio || 1, 2);
      resize(canvas, Math.max(1, Math.round(camera.width * scale)), Math.max(1, Math.round(camera.height * scale)));
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
      if (!width || !height) return false;

      const xScale = width / camera.width;
      const yScale = height / camera.height;
      const x = camera.x * xScale;
      const y = camera.y * yScale;
      const radiusX = camera.radius * xScale;
      const radiusY = camera.radius * yScale;
      const nextClip = globeClip(camera, Math.min(xScale, yScale));
      if (nextClip !== clip) {
        clip = nextClip;
        canvas.style.clipPath = clip;
      }
      const { east, north, center } = basis(camera);
      gl.viewport(0, 0, width, height);
      gl.uniform1f(uniforms.height, height);
      gl.uniform2f(uniforms.origin, x, y);
      gl.uniform2f(uniforms.radius, radiusX, radiusY);
      gl.uniform3fv(uniforms.east, east);
      gl.uniform3fv(uniforms.north, north);
      gl.uniform3fv(uniforms.center, center);
      gl.uniform1i(uniforms.terrainEnabled, camera.terrain !== false ? 1 : 0);
      drawGlobePixels(gl, width, height, x, y, radiusX, radiusY);
      return true;
    },
  };
}

function resize(canvas, width, height) {
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
}

function fitImage(image, maxDimension) {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  if (scale === 1) return image;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function imagePixels(image) {
  const source = document.createElement('canvas');
  source.width = image.width;
  source.height = image.height;
  const context = source.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, source.width, source.height);
  // Mirror GL's premultiplication so filtering a coastline doesn't darken it.
  // The software renderer only requires gray and alpha, not all four channels.
  const samples = new Uint8Array(width * height * 2);
  for (let pixel = 0, texel = 0; pixel < data.length; pixel += 4, texel += 2) {
    const alpha = data[pixel + 3];
    samples[texel] = Math.round(data[pixel] * alpha / 255);
    samples[texel + 1] = alpha;
  }
  return { samples, width, height };
}

function blendChannel(samples, a, b, c, d, x, y) {
  const top = samples[a] + (samples[b] - samples[a]) * x;
  const bottom = samples[c] + (samples[d] - samples[c]) * x;
  return Math.round(top + (bottom - top) * y);
}

function sampleTexture({ samples, width, height }, u, v, wrapLongitude) {
  const x = u * width - 0.5;
  const y = v * height - 0.5;
  const column = Math.floor(x);
  const row = Math.floor(y);
  const left = column < 0 ? (wrapLongitude ? width - 1 : 0) : column;
  const right = column + 1 >= width ? (wrapLongitude ? 0 : width - 1) : column + 1;
  const top = Math.max(0, row) * width;
  const bottom = Math.min(height - 1, row + 1) * width;
  const a = (top + left) * 2;
  const b = (top + right) * 2;
  const c = (bottom + left) * 2;
  const d = (bottom + right) * 2;
  const xMix = x - column;
  const yMix = y - row;
  const gray = blendChannel(samples, a, b, c, d, xMix, yMix);
  const alpha = blendChannel(samples, a + 1, b + 1, c + 1, d + 1, xMix, yMix);
  return (gray << 8) | alpha;
}

function smoothstep(progress) {
  const p = Math.min(1, Math.max(0, progress));
  return p * p * (3 - 2 * p);
}

function createSoftwareRenderer(canvas, output) {
  let terrain;
  let regionalTerrain;
  let frame;
  const [skyR, skyG, skyB] = SHADE.atmosphere;
  const [litSkyR, litSkyG, litSkyB] = SHADE.atmosphereLight;
  const [oceanR, oceanG, oceanB] = SHADE.ocean;
  const [deepR, deepG, deepB] = SHADE.oceanCenter;
  const [glintR, glintG, glintB] = SHADE.oceanLight;
  const [landR, landG, landB] = SHADE.land;
  const [litLandR, litLandG, litLandB] = SHADE.landLight;

  return {
    setImage(image) {
      terrain = imagePixels(image);
    },
    setRegionalImage(image) {
      regionalTerrain = imagePixels(image);
    },
    draw(camera) {
      const scale = Math.min(1, 800 / Math.max(camera.width, camera.height));
      const width = Math.max(1, Math.round(camera.width * scale));
      const height = Math.max(1, Math.round(camera.height * scale));
      resize(canvas, width, height);
      if (!frame || frame.width !== width || frame.height !== height) frame = output.createImageData(width, height);

      const { east, north, center } = basis(camera);
      const xScale = width / camera.width;
      const yScale = height / camera.height;
      const pixelRadius = Math.min(xScale, yScale) * camera.radius;
      const halo = Math.min(HALO_RATIO, HALO_PIXELS / pixelRadius);
      const haloDistance = (1 + halo) ** 2;
      const limbWidth = 1.3 / pixelRadius;
      const detailZoom = regionalTerrain
        ? smoothstep((pixelRadius - DETAIL_MIN_RADIUS) / (DETAIL_FULL_RADIUS - DETAIL_MIN_RADIUS)) : 0;
      const terrainEnabled = camera.terrain !== false;
      const [west, south, eastEdge, northEdge] = REGIONAL_BOUNDS;
      const pixels = frame.data;
      pixels.fill(0);

      for (let row = 0; row < height; row++) {
        const y = (camera.y - (row + 0.5) / yScale) / camera.radius;
        const ySquared = y * y;
        if (ySquared > haloDistance) continue;
        const span = Math.sqrt(haloDistance - ySquared) * camera.radius;
        const left = Math.max(0, Math.ceil((camera.x - span) * xScale - .5));
        const right = Math.min(width - 1, Math.floor((camera.x + span) * xScale - .5));
        for (let column = left; column <= right; column++) {
          const x = ((column + 0.5) / xScale - camera.x) / camera.radius;
          const distance = x * x + ySquared;
          const i = (row * width + column) * 4;
          const direction = -0.49 * x + 0.56 * y;
          const skyLight = Math.max(0, direction);
          const hazeR = skyR + litSkyR * skyLight;
          const hazeG = skyG + litSkyG * skyLight;
          const hazeB = skyB + litSkyB * skyLight;
          if (distance > 1) {
            const intensity = Math.exp(-4.8 * (Math.sqrt(distance) - 1) / halo);
            pixels[i] = hazeR;
            pixels[i + 1] = hazeG;
            pixels[i + 2] = hazeB;
            pixels[i + 3] = 255 * .30 * intensity;
            continue;
          }

          const z = Math.sqrt(1 - distance);
          let gray = 0;
          let land = 0;
          if (terrain || detailZoom > 0) {
            const wx = east[0] * x + north[0] * y + center[0] * z;
            const wy = north[1] * y + center[1] * z;
            const wz = east[2] * x + north[2] * y + center[2] * z;
            const u = 0.5 + Math.atan2(wz, wx) / (2 * Math.PI);
            const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, wy))) / Math.PI;
            if (terrain) {
              const sample = sampleTexture(terrain, u, v, true);
              gray = sample >>> 8;
              land = sample & 255;
            }
            if (detailZoom > 0) {
              const lon = (u - 0.5) * 360;
              const lat = (0.5 - v) * 180;
              const edge = Math.min(lon - west, eastEdge - lon, lat - south, northEdge - lat);
              const blend = detailZoom * smoothstep(edge / DETAIL_BLEND_DEGREES);
              if (blend > 0) {
                const uLocal = (lon - west) / (eastEdge - west);
                const vLocal = (northEdge - lat) / (northEdge - south);
                const local = sampleTexture(regionalTerrain, uLocal, vLocal, false);
                gray += blend * ((local >>> 8) - gray);
                land += blend * ((local & 255) - land);
              }
            }
          }

          const illumination = Math.max(0, direction + 0.67 * z);
          const light = 0.79 + 0.25 * illumination;
          const facingLight = illumination * illumination;
          const glint = facingLight * facingLight;
          const shade = terrainEnabled && land > 0 ? gray / land : 206 / 255;
          const stone = Math.max(0, Math.min(1, 0.50 + (shade - 0.78) * 2.55));
          const rim = 0.40 * (1 - z) ** 3.1;
          land /= 255;
          const sea = 1 - land;
          pixels[i] = (1 - rim) * light * (sea * (oceanR + deepR * z + glintR * glint) + land * (landR + litLandR * stone)) + rim * hazeR;
          pixels[i + 1] = (1 - rim) * light * (sea * (oceanG + deepG * z + glintG * glint) + land * (landG + litLandG * stone)) + rim * hazeG;
          pixels[i + 2] = (1 - rim) * light * (sea * (oceanB + deepB * z + glintB * glint) + land * (landB + litLandB * stone)) + rim * hazeB;
          pixels[i + 3] = 255 * (1 - .70 * smoothstep((Math.sqrt(distance) - 1 + limbWidth) / limbWidth));
        }
      }

      output.putImageData(frame, 0, 0);
    },
  };
}

export function createGlobe(canvas) {
  let latest;
  let terrain;
  let regionalTerrain;
  let regionalRequested = false;
  let hardware = createWebGLRenderer(canvas);
  let software;
  let fallback;
  const originalVisibility = canvas.style.visibility;

  function softwareRenderer() {
    if (software) return software;
    // A canvas that was bound to WebGL cannot be reused for Canvas 2D.
    // If WebGL was unavailable from the start, reuse the original element.
    let target = canvas;
    let output = canvas.getContext('2d');
    if (!output) {
      fallback = document.createElement('canvas');
      fallback.className = 'globe-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      Object.assign(fallback.style, {
        position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none',
      });
      target = fallback;
      output = fallback.getContext('2d');
      if (!output) return null;
      canvas.after(fallback);
      canvas.style.visibility = 'hidden';
    }
    software = createSoftwareRenderer(target, output);
    if (terrain) software.setImage(terrain);
    if (regionalTerrain) software.setRegionalImage(regionalTerrain);
    return software;
  }

  function requestRegionalTexture() {
    regionalRequested = true;
    const image = new Image();
    image.fetchPriority = 'low';
    image.decoding = 'async';
    image.onload = () => {
      regionalTerrain = image;
      hardware?.setRegionalImage(image);
      software?.setRegionalImage(image);
      if (latest) draw(latest);
    };
    image.src = REGIONAL_TEXTURE_URL;
  }

  function draw(camera) {
    if (!(camera.radius > 0 && camera.width > 0 && camera.height > 0)) return;
    latest = { ...camera };
    if (!regionalRequested && needsRegionalTexture(camera)) requestRegionalTexture();
    if (!hardware?.draw(camera)) {
      softwareRenderer()?.draw(camera);
      return;
    }
    if (fallback) {
      fallback.remove();
      fallback = undefined;
      software = undefined;
      canvas.style.visibility = originalVisibility;
    }
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    hardware = null;
    if (latest) draw(latest);
  });

  canvas.addEventListener('webglcontextrestored', () => {
    hardware = createWebGLRenderer(canvas);
    if (!hardware) return;
    if (terrain) hardware.setImage(terrain);
    if (regionalTerrain) hardware.setRegionalImage(regionalTerrain);
    if (latest) draw(latest);
  });

  const ready = new Promise(resolve => {
    const image = new Image();
    image.fetchPriority = 'high';
    image.onload = () => {
      terrain = image;
      hardware?.setImage(image);
      software?.setImage(image);
      if (latest) draw(latest);
      resolve(true);
    };
    image.onerror = () => resolve(false);
    image.src = smallScreen ? COMPACT_TEXTURE_URL : TEXTURE_URL;
  });

  return { draw, project, ready };
}
