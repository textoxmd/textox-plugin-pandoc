import { Plugin as ke } from "@textox/plugin-sdk";
import { invoke as ee, convertFileSrc as Be } from "@tauri-apps/api/core";
const ve = "gfm+tex_math_dollars+footnotes", We = {
  docx: "out.docx",
  odt: "out.odt",
  rtf: "out.rtf",
  latex: "out.tex"
}, ze = {
  docx: "docx",
  odt: "odt",
  rtf: "rtf",
  latex: "tex"
};
function Ue(f) {
  return We[f];
}
function Pe(f) {
  return ze[f];
}
function Ce(f, e) {
  return {
    from: ve,
    to: f,
    standalone: !0,
    "output-file": Ue(f),
    ...e.toc ? { "table-of-contents": !0 } : {},
    ...e.numberSections ? { "number-sections": !0 } : {}
  };
}
function Xe(f, e) {
  return `${(f?.split(/[\\/]/).pop() ?? "").replace(/\.[^.]+$/, "") || "Untitled"}.${Pe(e)}`;
}
const Ae = /!\[([^\]\n]*)\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+(["'])([^"']*)\3)?\s*\)/g, je = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/avif": "avif"
};
function Ee(f) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(f);
}
function K(f) {
  return f.startsWith("<") && f.endsWith(">") ? f.slice(1, -1) : f;
}
function Ve(f) {
  try {
    return decodeURIComponent(f);
  } catch {
    return f;
  }
}
function be(f) {
  const e = /^[\\/]/.test(f) || /^[a-zA-Z]:[\\/]/.test(f), t = [];
  for (const o of f.split(/[\\/]+/))
    if (!(!o || o === ".")) {
      if (o === "..") {
        t.pop();
        continue;
      }
      t.push(o);
    }
  return `${e ? "/" : ""}${t.join("/")}`;
}
function Re(f, e) {
  if (!e) return null;
  const t = Ve(K(f));
  return /^[\\/]/.test(t) || /^[a-zA-Z]:[\\/]/.test(t) ? be(t) : be(`${e}/${t}`);
}
function $e(f) {
  const e = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(f);
  if (!e) return null;
  const t = e[1] || "application/octet-stream";
  if (e[2]) {
    const o = atob(e[3] ?? ""), l = new Uint8Array(o.length);
    for (let n = 0; n < o.length; n += 1) l[n] = o.charCodeAt(n);
    return { mime: t, bytes: l };
  }
  return { mime: t, bytes: new TextEncoder().encode(decodeURIComponent(e[3] ?? "")) };
}
function Me(f, e) {
  const t = je[f.toLowerCase()];
  return t || (/\.([a-z0-9]+)(?:\?.*)?$/i.exec(K(e))?.[1]?.toLowerCase() ?? "png");
}
const Ke = (f) => ee("read_image_as_data_url", { path: f });
function Fe(f, e) {
  let t = null;
  return f.split(`
`).map((o) => {
    const l = /^\s*(`{3,}|~{3,})/.exec(o)?.[1];
    return l ? (t ? (l[0] ?? "`") === t && (t = null) : t = l[0] ?? "`", o) : t ? o : e(o);
  }).join(`
`);
}
function Ge(f, e) {
  const t = /* @__PURE__ */ new Set();
  return Fe(f, (o) => {
    for (const l of o.matchAll(Ae)) {
      const n = l[2];
      if (!n || Ee(K(n))) continue;
      const r = Re(n, e);
      r && t.add(r);
    }
    return o;
  }), [...t];
}
async function Ye(f, e, t = Ke) {
  const o = {}, l = /* @__PURE__ */ new Map(), n = Ge(f, e);
  for (const [s, i] of n.entries())
    try {
      const a = await t(i), c = $e(a);
      if (!c) continue;
      const d = `textox-image-${s + 1}.${Me(c.mime, i)}`;
      l.set(i, d), o[d] = new Blob([c.bytes], { type: c.mime });
    } catch (a) {
      console.warn(`[pandoc] failed to read image ${i}:`, a);
    }
  return l.size === 0 ? { markdown: f, files: o } : { markdown: Fe(
    f,
    (s) => s.replace(
      Ae,
      (i, a, c, d, h) => {
        if (Ee(K(c))) return i;
        const _ = Re(c, e), m = _ ? l.get(_) : void 0;
        if (!m) return i;
        const p = d ? `${m} ${d}${h ?? ""}${d}` : m;
        return `![${a}](${p})`;
      }
    )
  ), files: o };
}
const He = "app.textox.pandoc", Y = 0, H = 1, y = 0, b = 8, V = 20, k = 28, ge = 31, Je = 37, O = 44, Ze = 52, R = 54, ye = 55, w = 58, Q = 63, we = 76, q = 64;
class W {
  static read_bytes(e, t) {
    const o = new W();
    return o.buf = e.getUint32(t, !0), o.buf_len = e.getUint32(t + 4, !0), o;
  }
  static read_bytes_array(e, t, o) {
    const l = [];
    for (let n = 0; n < o; n++)
      l.push(W.read_bytes(e, t + 8 * n));
    return l;
  }
}
class z {
  static read_bytes(e, t) {
    const o = new z();
    return o.buf = e.getUint32(t, !0), o.buf_len = e.getUint32(t + 4, !0), o;
  }
  static read_bytes_array(e, t, o) {
    const l = [];
    for (let n = 0; n < o; n++)
      l.push(z.read_bytes(e, t + 8 * n));
    return l;
  }
}
const Qe = 0, qe = 1, Se = 2, xe = 2, D = 3, $ = 4;
class J {
  head_length() {
    return 24;
  }
  name_length() {
    return this.dir_name.byteLength;
  }
  write_head_bytes(e, t) {
    e.setBigUint64(t, this.d_next, !0), e.setBigUint64(t + 8, this.d_ino, !0), e.setUint32(t + 16, this.dir_name.length, !0), e.setUint8(t + 20, this.d_type);
  }
  write_name_bytes(e, t, o) {
    e.set(this.dir_name.slice(0, Math.min(this.dir_name.byteLength, o)), t);
  }
  constructor(e, t, o, l) {
    const n = new TextEncoder().encode(o);
    this.d_next = e, this.d_ino = t, this.d_namlen = n.byteLength, this.d_type = l, this.dir_name = n;
  }
}
const et = 1;
class te {
  write_bytes(e, t) {
    e.setUint8(t, this.fs_filetype), e.setUint16(t + 2, this.fs_flags, !0), e.setBigUint64(t + 8, this.fs_rights_base, !0), e.setBigUint64(t + 16, this.fs_rights_inherited, !0);
  }
  constructor(e, t) {
    this.fs_rights_base = 0n, this.fs_rights_inherited = 0n, this.fs_filetype = e, this.fs_flags = t;
  }
}
const Z = 1, v = 2, Te = 4, Le = 8;
class ne {
  write_bytes(e, t) {
    e.setBigUint64(t, this.dev, !0), e.setBigUint64(t + 8, this.ino, !0), e.setUint8(t + 16, this.filetype), e.setBigUint64(t + 24, this.nlink, !0), e.setBigUint64(t + 32, this.size, !0), e.setBigUint64(t + 38, this.atim, !0), e.setBigUint64(t + 46, this.mtim, !0), e.setBigUint64(t + 52, this.ctim, !0);
  }
  constructor(e, t, o) {
    this.dev = 0n, this.nlink = 0n, this.atim = 0n, this.mtim = 0n, this.ctim = 0n, this.ino = e, this.filetype = t, this.size = o;
  }
}
const tt = 0, nt = 1;
class re {
  static read_bytes(e, t) {
    return new re(e.getBigUint64(t, !0), e.getUint8(t + 8), e.getUint32(t + 16, !0), e.getBigUint64(t + 24, !0), e.getUint16(t + 36, !0));
  }
  constructor(e, t, o, l, n) {
    this.userdata = e, this.eventtype = t, this.clockid = o, this.timeout = l, this.flags = n;
  }
}
class rt {
  write_bytes(e, t) {
    e.setBigUint64(t, this.userdata, !0), e.setUint16(t + 8, this.error, !0), e.setUint8(t + 10, this.eventtype);
  }
  constructor(e, t, o) {
    this.userdata = e, this.error = t, this.eventtype = o;
  }
}
const st = 0;
class it {
  write_bytes(e, t) {
    e.setUint32(t, this.pr_name.byteLength, !0);
  }
  constructor(e) {
    this.pr_name = new TextEncoder().encode(e);
  }
}
class se {
  static dir(e) {
    const t = new se();
    return t.tag = st, t.inner = new it(e), t;
  }
  write_bytes(e, t) {
    e.setUint32(t, this.tag, !0), this.inner.write_bytes(e, t + 4);
  }
}
let ot = class {
  enable(e) {
    this.log = at(e === void 0 ? !0 : e, this.prefix);
  }
  get enabled() {
    return this.isEnabled;
  }
  constructor(e) {
    this.isEnabled = e, this.prefix = "wasi:", this.enable(e);
  }
};
function at(f, e) {
  return f ? console.log.bind(console, "%c%s", "color: #265BA0", e) : () => {
  };
}
const x = new ot(!1);
class De extends Error {
  constructor(e) {
    super("exit with exit code " + e), this.code = e;
  }
}
let ct = class {
  start(e) {
    this.inst = e;
    try {
      return e.exports._start(), 0;
    } catch (t) {
      if (t instanceof De)
        return t.code;
      throw t;
    }
  }
  initialize(e) {
    this.inst = e, e.exports._initialize && e.exports._initialize();
  }
  constructor(e, t, o, l = {}) {
    this.args = [], this.env = [], this.fds = [], x.enable(l.debug), this.args = e, this.env = t, this.fds = o;
    const n = this;
    this.wasiImport = { args_sizes_get(r, s) {
      const i = new DataView(n.inst.exports.memory.buffer);
      i.setUint32(r, n.args.length, !0);
      let a = 0;
      for (const c of n.args)
        a += c.length + 1;
      return i.setUint32(s, a, !0), x.log(i.getUint32(r, !0), i.getUint32(s, !0)), 0;
    }, args_get(r, s) {
      const i = new DataView(n.inst.exports.memory.buffer), a = new Uint8Array(n.inst.exports.memory.buffer), c = s;
      for (let d = 0; d < n.args.length; d++) {
        i.setUint32(r, s, !0), r += 4;
        const h = new TextEncoder().encode(n.args[d]);
        a.set(h, s), i.setUint8(s + h.length, 0), s += h.length + 1;
      }
      return x.enabled && x.log(new TextDecoder("utf-8").decode(a.slice(c, s))), 0;
    }, environ_sizes_get(r, s) {
      const i = new DataView(n.inst.exports.memory.buffer);
      i.setUint32(r, n.env.length, !0);
      let a = 0;
      for (const c of n.env)
        a += new TextEncoder().encode(c).length + 1;
      return i.setUint32(s, a, !0), x.log(i.getUint32(r, !0), i.getUint32(s, !0)), 0;
    }, environ_get(r, s) {
      const i = new DataView(n.inst.exports.memory.buffer), a = new Uint8Array(n.inst.exports.memory.buffer), c = s;
      for (let d = 0; d < n.env.length; d++) {
        i.setUint32(r, s, !0), r += 4;
        const h = new TextEncoder().encode(n.env[d]);
        a.set(h, s), i.setUint8(s + h.length, 0), s += h.length + 1;
      }
      return x.enabled && x.log(new TextDecoder("utf-8").decode(a.slice(c, s))), 0;
    }, clock_res_get(r, s) {
      let i;
      switch (r) {
        case H: {
          i = 5000n;
          break;
        }
        case Y: {
          i = 1000000n;
          break;
        }
        default:
          return Ze;
      }
      return new DataView(n.inst.exports.memory.buffer).setBigUint64(s, i, !0), y;
    }, clock_time_get(r, s, i) {
      const a = new DataView(n.inst.exports.memory.buffer);
      if (r === Y)
        a.setBigUint64(i, BigInt((/* @__PURE__ */ new Date()).getTime()) * 1000000n, !0);
      else if (r == H) {
        let c;
        try {
          c = BigInt(Math.round(performance.now() * 1e6));
        } catch {
          c = 0n;
        }
        a.setBigUint64(i, c, !0);
      } else
        a.setBigUint64(i, 0n, !0);
      return 0;
    }, fd_advise(r, s, i, a) {
      return n.fds[r] != null ? y : b;
    }, fd_allocate(r, s, i) {
      return n.fds[r] != null ? n.fds[r].fd_allocate(s, i) : b;
    }, fd_close(r) {
      if (n.fds[r] != null) {
        const s = n.fds[r].fd_close();
        return n.fds[r] = void 0, s;
      } else
        return b;
    }, fd_datasync(r) {
      return n.fds[r] != null ? n.fds[r].fd_sync() : b;
    }, fd_fdstat_get(r, s) {
      if (n.fds[r] != null) {
        const { ret: i, fdstat: a } = n.fds[r].fd_fdstat_get();
        return a?.write_bytes(new DataView(n.inst.exports.memory.buffer), s), i;
      } else
        return b;
    }, fd_fdstat_set_flags(r, s) {
      return n.fds[r] != null ? n.fds[r].fd_fdstat_set_flags(s) : b;
    }, fd_fdstat_set_rights(r, s, i) {
      return n.fds[r] != null ? n.fds[r].fd_fdstat_set_rights(s, i) : b;
    }, fd_filestat_get(r, s) {
      if (n.fds[r] != null) {
        const { ret: i, filestat: a } = n.fds[r].fd_filestat_get();
        return a?.write_bytes(new DataView(n.inst.exports.memory.buffer), s), i;
      } else
        return b;
    }, fd_filestat_set_size(r, s) {
      return n.fds[r] != null ? n.fds[r].fd_filestat_set_size(s) : b;
    }, fd_filestat_set_times(r, s, i, a) {
      return n.fds[r] != null ? n.fds[r].fd_filestat_set_times(s, i, a) : b;
    }, fd_pread(r, s, i, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), h = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const _ = W.read_bytes_array(d, s, i);
        let m = 0;
        for (const p of _) {
          const { ret: u, data: g } = n.fds[r].fd_pread(p.buf_len, a);
          if (u != y)
            return d.setUint32(c, m, !0), u;
          if (h.set(g, p.buf), m += g.length, a += BigInt(g.length), g.length != p.buf_len)
            break;
        }
        return d.setUint32(c, m, !0), y;
      } else
        return b;
    }, fd_prestat_get(r, s) {
      const i = new DataView(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const { ret: a, prestat: c } = n.fds[r].fd_prestat_get();
        return c?.write_bytes(i, s), a;
      } else
        return b;
    }, fd_prestat_dir_name(r, s, i) {
      if (n.fds[r] != null) {
        const { ret: a, prestat: c } = n.fds[r].fd_prestat_get();
        if (c == null)
          return a;
        const d = c.inner.pr_name;
        return new Uint8Array(n.inst.exports.memory.buffer).set(d.slice(0, i), s), d.byteLength > i ? Je : y;
      } else
        return b;
    }, fd_pwrite(r, s, i, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), h = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const _ = z.read_bytes_array(d, s, i);
        let m = 0;
        for (const p of _) {
          const u = h.slice(p.buf, p.buf + p.buf_len), { ret: g, nwritten: L } = n.fds[r].fd_pwrite(u, a);
          if (g != y)
            return d.setUint32(c, m, !0), g;
          if (m += L, a += BigInt(L), L != u.byteLength)
            break;
        }
        return d.setUint32(c, m, !0), y;
      } else
        return b;
    }, fd_read(r, s, i, a) {
      const c = new DataView(n.inst.exports.memory.buffer), d = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const h = W.read_bytes_array(c, s, i);
        let _ = 0;
        for (const m of h) {
          const { ret: p, data: u } = n.fds[r].fd_read(m.buf_len);
          if (p != y)
            return c.setUint32(a, _, !0), p;
          if (d.set(u, m.buf), _ += u.length, u.length != m.buf_len)
            break;
        }
        return c.setUint32(a, _, !0), y;
      } else
        return b;
    }, fd_readdir(r, s, i, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), h = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        let _ = 0;
        for (; ; ) {
          const { ret: m, dirent: p } = n.fds[r].fd_readdir_single(a);
          if (m != 0)
            return d.setUint32(c, _, !0), m;
          if (p == null)
            break;
          if (i - _ < p.head_length()) {
            _ = i;
            break;
          }
          const u = new ArrayBuffer(p.head_length());
          if (p.write_head_bytes(new DataView(u), 0), h.set(new Uint8Array(u).slice(0, Math.min(u.byteLength, i - _)), s), s += p.head_length(), _ += p.head_length(), i - _ < p.name_length()) {
            _ = i;
            break;
          }
          p.write_name_bytes(h, s, i - _), s += p.name_length(), _ += p.name_length(), a = p.d_next;
        }
        return d.setUint32(c, _, !0), 0;
      } else
        return b;
    }, fd_renumber(r, s) {
      if (n.fds[r] != null && n.fds[s] != null) {
        const i = n.fds[s].fd_close();
        return i != 0 ? i : (n.fds[s] = n.fds[r], n.fds[r] = void 0, 0);
      } else
        return b;
    }, fd_seek(r, s, i, a) {
      const c = new DataView(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const { ret: d, offset: h } = n.fds[r].fd_seek(s, i);
        return c.setBigInt64(a, h, !0), d;
      } else
        return b;
    }, fd_sync(r) {
      return n.fds[r] != null ? n.fds[r].fd_sync() : b;
    }, fd_tell(r, s) {
      const i = new DataView(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const { ret: a, offset: c } = n.fds[r].fd_tell();
        return i.setBigUint64(s, c, !0), a;
      } else
        return b;
    }, fd_write(r, s, i, a) {
      const c = new DataView(n.inst.exports.memory.buffer), d = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const h = z.read_bytes_array(c, s, i);
        let _ = 0;
        for (const m of h) {
          const p = d.slice(m.buf, m.buf + m.buf_len), { ret: u, nwritten: g } = n.fds[r].fd_write(p);
          if (u != y)
            return c.setUint32(a, _, !0), u;
          if (_ += g, g != p.byteLength)
            break;
        }
        return c.setUint32(a, _, !0), y;
      } else
        return b;
    }, path_create_directory(r, s, i) {
      const a = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const c = new TextDecoder("utf-8").decode(a.slice(s, s + i));
        return n.fds[r].path_create_directory(c);
      } else
        return b;
    }, path_filestat_get(r, s, i, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), h = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const _ = new TextDecoder("utf-8").decode(h.slice(i, i + a)), { ret: m, filestat: p } = n.fds[r].path_filestat_get(s, _);
        return p?.write_bytes(d, c), m;
      } else
        return b;
    }, path_filestat_set_times(r, s, i, a, c, d, h) {
      const _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const m = new TextDecoder("utf-8").decode(_.slice(i, i + a));
        return n.fds[r].path_filestat_set_times(s, m, c, d, h);
      } else
        return b;
    }, path_link(r, s, i, a, c, d, h) {
      const _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null && n.fds[c] != null) {
        const m = new TextDecoder("utf-8").decode(_.slice(i, i + a)), p = new TextDecoder("utf-8").decode(_.slice(d, d + h)), { ret: u, inode_obj: g } = n.fds[r].path_lookup(m, s);
        return g == null ? u : n.fds[c].path_link(p, g, !1);
      } else
        return b;
    }, path_open(r, s, i, a, c, d, h, _, m) {
      const p = new DataView(n.inst.exports.memory.buffer), u = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const g = new TextDecoder("utf-8").decode(u.slice(i, i + a));
        x.log(g);
        const { ret: L, fd_obj: U } = n.fds[r].path_open(s, g, c, d, h, _);
        if (L != 0)
          return L;
        n.fds.push(U);
        const G = n.fds.length - 1;
        return p.setUint32(m, G, !0), 0;
      } else
        return b;
    }, path_readlink(r, s, i, a, c, d) {
      const h = new DataView(n.inst.exports.memory.buffer), _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const m = new TextDecoder("utf-8").decode(_.slice(s, s + i));
        x.log(m);
        const { ret: p, data: u } = n.fds[r].path_readlink(m);
        if (u != null) {
          const g = new TextEncoder().encode(u);
          if (g.length > c)
            return h.setUint32(d, 0, !0), b;
          _.set(g, a), h.setUint32(d, g.length, !0);
        }
        return p;
      } else
        return b;
    }, path_remove_directory(r, s, i) {
      const a = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const c = new TextDecoder("utf-8").decode(a.slice(s, s + i));
        return n.fds[r].path_remove_directory(c);
      } else
        return b;
    }, path_rename(r, s, i, a, c, d) {
      const h = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null && n.fds[a] != null) {
        const _ = new TextDecoder("utf-8").decode(h.slice(s, s + i)), m = new TextDecoder("utf-8").decode(h.slice(c, c + d));
        let { ret: p, inode_obj: u } = n.fds[r].path_unlink(_);
        if (u == null)
          return p;
        if (p = n.fds[a].path_link(m, u, !0), p != y && n.fds[r].path_link(_, u, !0) != y)
          throw "path_link should always return success when relinking an inode back to the original place";
        return p;
      } else
        return b;
    }, path_symlink(r, s, i, a, c) {
      const d = new Uint8Array(n.inst.exports.memory.buffer);
      return n.fds[i] != null ? (new TextDecoder("utf-8").decode(d.slice(r, r + s)), new TextDecoder("utf-8").decode(d.slice(a, a + c)), w) : b;
    }, path_unlink_file(r, s, i) {
      const a = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const c = new TextDecoder("utf-8").decode(a.slice(s, s + i));
        return n.fds[r].path_unlink_file(c);
      } else
        return b;
    }, poll_oneoff(r, s, i) {
      if (i === 0)
        return k;
      if (i > 1)
        return x.log("poll_oneoff: only a single subscription is supported"), w;
      const a = new DataView(n.inst.exports.memory.buffer), c = re.read_bytes(a, r), d = c.eventtype, h = c.clockid, _ = c.timeout;
      if (d !== tt)
        return x.log("poll_oneoff: only clock subscriptions are supported"), w;
      let m;
      if (h === H)
        m = () => BigInt(Math.round(performance.now() * 1e6));
      else if (h === Y)
        m = () => BigInt((/* @__PURE__ */ new Date()).getTime()) * 1000000n;
      else
        return k;
      const p = (c.flags & nt) !== 0 ? _ : m() + _;
      for (; p > m(); )
        ;
      return new rt(c.userdata, y, d).write_bytes(a, s), y;
    }, proc_exit(r) {
      throw new De(r);
    }, proc_raise(r) {
      throw "raised signal " + r;
    }, sched_yield() {
    }, random_get(r, s) {
      const i = new Uint8Array(n.inst.exports.memory.buffer).subarray(r, r + s);
      if ("crypto" in globalThis && (typeof SharedArrayBuffer > "u" || !(n.inst.exports.memory.buffer instanceof SharedArrayBuffer)))
        for (let a = 0; a < s; a += 65536)
          crypto.getRandomValues(i.subarray(a, a + 65536));
      else
        for (let a = 0; a < s; a++)
          i[a] = Math.random() * 256 | 0;
    }, sock_recv(r, s, i) {
      throw "sockets not supported";
    }, sock_send(r, s, i) {
      throw "sockets not supported";
    }, sock_shutdown(r, s) {
      throw "sockets not supported";
    }, sock_accept(r, s) {
      throw "sockets not supported";
    } };
  }
};
class ie {
  fd_allocate(e, t) {
    return w;
  }
  fd_close() {
    return 0;
  }
  fd_fdstat_get() {
    return { ret: w, fdstat: null };
  }
  fd_fdstat_set_flags(e) {
    return w;
  }
  fd_fdstat_set_rights(e, t) {
    return w;
  }
  fd_filestat_get() {
    return { ret: w, filestat: null };
  }
  fd_filestat_set_size(e) {
    return w;
  }
  fd_filestat_set_times(e, t, o) {
    return w;
  }
  fd_pread(e, t) {
    return { ret: w, data: new Uint8Array() };
  }
  fd_prestat_get() {
    return { ret: w, prestat: null };
  }
  fd_pwrite(e, t) {
    return { ret: w, nwritten: 0 };
  }
  fd_read(e) {
    return { ret: w, data: new Uint8Array() };
  }
  fd_readdir_single(e) {
    return { ret: w, dirent: null };
  }
  fd_seek(e, t) {
    return { ret: w, offset: 0n };
  }
  fd_sync() {
    return 0;
  }
  fd_tell() {
    return { ret: w, offset: 0n };
  }
  fd_write(e) {
    return { ret: w, nwritten: 0 };
  }
  path_create_directory(e) {
    return w;
  }
  path_filestat_get(e, t) {
    return { ret: w, filestat: null };
  }
  path_filestat_set_times(e, t, o, l, n) {
    return w;
  }
  path_link(e, t, o) {
    return w;
  }
  path_unlink(e) {
    return { ret: w, inode_obj: null };
  }
  path_lookup(e, t) {
    return { ret: w, inode_obj: null };
  }
  path_open(e, t, o, l, n, r) {
    return { ret: R, fd_obj: null };
  }
  path_readlink(e) {
    return { ret: w, data: null };
  }
  path_remove_directory(e) {
    return w;
  }
  path_rename(e, t, o) {
    return w;
  }
  path_unlink_file(e) {
    return w;
  }
}
class F {
  static issue_ino() {
    return F.next_ino++;
  }
  static root_ino() {
    return 0n;
  }
  constructor() {
    this.ino = F.issue_ino();
  }
}
F.next_ino = 1n;
class Oe extends ie {
  fd_allocate(e, t) {
    if (!(this.file.size > e + t)) {
      const o = new Uint8Array(Number(e + t));
      o.set(this.file.data, 0), this.file.data = o;
    }
    return y;
  }
  fd_fdstat_get() {
    return { ret: 0, fdstat: new te($, 0) };
  }
  fd_filestat_set_size(e) {
    if (this.file.size > e)
      this.file.data = new Uint8Array(this.file.data.buffer.slice(0, Number(e)));
    else {
      const t = new Uint8Array(Number(e));
      t.set(this.file.data, 0), this.file.data = t;
    }
    return y;
  }
  fd_read(e) {
    const t = this.file.data.slice(Number(this.file_pos), Number(this.file_pos + BigInt(e)));
    return this.file_pos += BigInt(t.length), { ret: 0, data: t };
  }
  fd_pread(e, t) {
    return { ret: 0, data: this.file.data.slice(Number(t), Number(t + BigInt(e))) };
  }
  fd_seek(e, t) {
    let o;
    switch (t) {
      case Qe:
        o = e;
        break;
      case qe:
        o = this.file_pos + e;
        break;
      case Se:
        o = BigInt(this.file.data.byteLength) + e;
        break;
      default:
        return { ret: k, offset: 0n };
    }
    return o < 0 ? { ret: k, offset: 0n } : (this.file_pos = o, { ret: 0, offset: this.file_pos });
  }
  fd_tell() {
    return { ret: 0, offset: this.file_pos };
  }
  fd_write(e) {
    if (this.file.readonly) return { ret: b, nwritten: 0 };
    if (this.file_pos + BigInt(e.byteLength) > this.file.size) {
      const t = this.file.data;
      this.file.data = new Uint8Array(Number(this.file_pos + BigInt(e.byteLength))), this.file.data.set(t);
    }
    return this.file.data.set(e, Number(this.file_pos)), this.file_pos += BigInt(e.byteLength), { ret: 0, nwritten: e.byteLength };
  }
  fd_pwrite(e, t) {
    if (this.file.readonly) return { ret: b, nwritten: 0 };
    if (t + BigInt(e.byteLength) > this.file.size) {
      const o = this.file.data;
      this.file.data = new Uint8Array(Number(t + BigInt(e.byteLength))), this.file.data.set(o);
    }
    return this.file.data.set(e, Number(t)), { ret: 0, nwritten: e.byteLength };
  }
  fd_filestat_get() {
    return { ret: 0, filestat: this.file.stat() };
  }
  constructor(e) {
    super(), this.file_pos = 0n, this.file = e;
  }
}
class Ne extends ie {
  fd_seek(e, t) {
    return { ret: b, offset: 0n };
  }
  fd_tell() {
    return { ret: b, offset: 0n };
  }
  fd_allocate(e, t) {
    return b;
  }
  fd_fdstat_get() {
    return { ret: 0, fdstat: new te(D, 0) };
  }
  fd_readdir_single(e) {
    if (x.enabled && (x.log("readdir_single", e), x.log(e, this.dir.contents.keys())), e == 0n)
      return { ret: y, dirent: new J(1n, this.dir.ino, ".", D) };
    if (e == 1n)
      return { ret: y, dirent: new J(2n, this.dir.parent_ino(), "..", D) };
    if (e >= BigInt(this.dir.contents.size) + 2n)
      return { ret: 0, dirent: null };
    const [t, o] = Array.from(this.dir.contents.entries())[Number(e - 2n)];
    return { ret: 0, dirent: new J(e + 1n, o.ino, t, o.stat().filetype) };
  }
  path_filestat_get(e, t) {
    const { ret: o, path: l } = E.from(t);
    if (l == null)
      return { ret: o, filestat: null };
    const { ret: n, entry: r } = this.dir.get_entry_for_path(l);
    return r == null ? { ret: n, filestat: null } : { ret: 0, filestat: r.stat() };
  }
  path_lookup(e, t) {
    const { ret: o, path: l } = E.from(e);
    if (l == null)
      return { ret: o, inode_obj: null };
    const { ret: n, entry: r } = this.dir.get_entry_for_path(l);
    return r == null ? { ret: n, inode_obj: null } : { ret: y, inode_obj: r };
  }
  path_open(e, t, o, l, n, r) {
    const { ret: s, path: i } = E.from(t);
    if (i == null)
      return { ret: s, fd_obj: null };
    let { ret: a, entry: c } = this.dir.get_entry_for_path(i);
    if (c == null) {
      if (a != O)
        return { ret: a, fd_obj: null };
      if ((o & Z) == Z) {
        const { ret: d, entry: h } = this.dir.create_entry_for_path(t, (o & v) == v);
        if (h == null)
          return { ret: d, fd_obj: null };
        c = h;
      } else
        return { ret: O, fd_obj: null };
    } else if ((o & Te) == Te)
      return { ret: V, fd_obj: null };
    return (o & v) == v && c.stat().filetype !== D ? { ret: R, fd_obj: null } : c.path_open(o, l, r);
  }
  path_create_directory(e) {
    return this.path_open(0, e, Z | v, 0n, 0n, 0).ret;
  }
  path_link(e, t, o) {
    const { ret: l, path: n } = E.from(e);
    if (n == null)
      return l;
    if (n.is_dir)
      return O;
    const { ret: r, parent_entry: s, filename: i, entry: a } = this.dir.get_parent_dir_and_entry_for_path(n, !0);
    if (s == null || i == null)
      return r;
    if (a != null) {
      const c = t.stat().filetype == D, d = a.stat().filetype == D;
      if (c && d)
        if (o && a instanceof A) {
          if (a.contents.size != 0) return ye;
        } else
          return V;
      else {
        if (c && !d)
          return R;
        if (!c && d)
          return ge;
        if (!(t.stat().filetype == $ && a.stat().filetype == $)) return V;
      }
    }
    return !o && t.stat().filetype == D ? Q : (s.contents.set(i, t), y);
  }
  path_unlink(e) {
    const { ret: t, path: o } = E.from(e);
    if (o == null)
      return { ret: t, inode_obj: null };
    const { ret: l, parent_entry: n, filename: r, entry: s } = this.dir.get_parent_dir_and_entry_for_path(o, !0);
    return n == null || r == null ? { ret: l, inode_obj: null } : s == null ? { ret: O, inode_obj: null } : (n.contents.delete(r), { ret: y, inode_obj: s });
  }
  path_unlink_file(e) {
    const { ret: t, path: o } = E.from(e);
    if (o == null)
      return t;
    const { ret: l, parent_entry: n, filename: r, entry: s } = this.dir.get_parent_dir_and_entry_for_path(o, !1);
    return n == null || r == null || s == null ? l : s.stat().filetype === D ? ge : (n.contents.delete(r), y);
  }
  path_remove_directory(e) {
    const { ret: t, path: o } = E.from(e);
    if (o == null)
      return t;
    const { ret: l, parent_entry: n, filename: r, entry: s } = this.dir.get_parent_dir_and_entry_for_path(o, !1);
    return n == null || r == null || s == null ? l : !(s instanceof A) || s.stat().filetype !== D ? R : s.contents.size !== 0 ? ye : n.contents.delete(r) ? y : O;
  }
  fd_filestat_get() {
    return { ret: 0, filestat: this.dir.stat() };
  }
  fd_filestat_set_size(e) {
    return b;
  }
  fd_read(e) {
    return { ret: b, data: new Uint8Array() };
  }
  fd_pread(e, t) {
    return { ret: b, data: new Uint8Array() };
  }
  fd_write(e) {
    return { ret: b, nwritten: 0 };
  }
  fd_pwrite(e, t) {
    return { ret: b, nwritten: 0 };
  }
  constructor(e) {
    super(), this.dir = e;
  }
}
class ft extends Ne {
  fd_prestat_get() {
    return { ret: 0, prestat: se.dir(this.prestat_name) };
  }
  constructor(e, t) {
    super(new A(t)), this.prestat_name = e;
  }
}
class P extends F {
  path_open(e, t, o) {
    if (this.readonly && (t & BigInt(q)) == BigInt(q))
      return { ret: Q, fd_obj: null };
    if ((e & Le) == Le) {
      if (this.readonly) return { ret: Q, fd_obj: null };
      this.data = new Uint8Array([]);
    }
    const l = new Oe(this);
    return o & et && l.fd_seek(0n, Se), { ret: y, fd_obj: l };
  }
  get size() {
    return BigInt(this.data.byteLength);
  }
  stat() {
    return new ne(this.ino, $, this.size);
  }
  constructor(e, t) {
    super(), this.data = new Uint8Array(e), this.readonly = !!t?.readonly;
  }
}
let E = class Ie {
  static from(e) {
    const t = new Ie();
    if (t.is_dir = e.endsWith("/"), e.startsWith("/"))
      return { ret: we, path: null };
    if (e.includes("\0"))
      return { ret: k, path: null };
    for (const o of e.split("/"))
      if (!(o === "" || o === ".")) {
        if (o === "..") {
          if (t.parts.pop() == null)
            return { ret: we, path: null };
          continue;
        }
        t.parts.push(o);
      }
    return { ret: y, path: t };
  }
  to_path_string() {
    let e = this.parts.join("/");
    return this.is_dir && (e += "/"), e;
  }
  constructor() {
    this.parts = [], this.is_dir = !1;
  }
};
class A extends F {
  parent_ino() {
    return this.parent == null ? F.root_ino() : this.parent.ino;
  }
  path_open(e, t, o) {
    return { ret: y, fd_obj: new Ne(this) };
  }
  stat() {
    return new ne(this.ino, D, 0n);
  }
  get_entry_for_path(e) {
    let t = this;
    for (const o of e.parts) {
      if (!(t instanceof A))
        return { ret: R, entry: null };
      const l = t.contents.get(o);
      if (l !== void 0)
        t = l;
      else
        return x.log(o), { ret: O, entry: null };
    }
    return e.is_dir && t.stat().filetype != D ? { ret: R, entry: null } : { ret: y, entry: t };
  }
  get_parent_dir_and_entry_for_path(e, t) {
    const o = e.parts.pop();
    if (o === void 0)
      return { ret: k, parent_entry: null, filename: null, entry: null };
    const { ret: l, entry: n } = this.get_entry_for_path(e);
    if (n == null)
      return { ret: l, parent_entry: null, filename: null, entry: null };
    if (!(n instanceof A))
      return { ret: R, parent_entry: null, filename: null, entry: null };
    const r = n.contents.get(o);
    return r === void 0 ? t ? { ret: y, parent_entry: n, filename: o, entry: null } : { ret: O, parent_entry: null, filename: null, entry: null } : e.is_dir && r.stat().filetype != D ? { ret: R, parent_entry: null, filename: null, entry: null } : { ret: y, parent_entry: n, filename: o, entry: r };
  }
  create_entry_for_path(e, t) {
    const { ret: o, path: l } = E.from(e);
    if (l == null)
      return { ret: o, entry: null };
    let { ret: n, parent_entry: r, filename: s, entry: i } = this.get_parent_dir_and_entry_for_path(l, !0);
    if (r == null || s == null)
      return { ret: n, entry: null };
    if (i != null)
      return { ret: V, entry: null };
    x.log("create", l);
    let a;
    return t ? a = new A(/* @__PURE__ */ new Map()) : a = new P(new ArrayBuffer(0)), r.contents.set(s, a), i = a, { ret: y, entry: i };
  }
  constructor(e) {
    super(), this.parent = null, e instanceof Array ? this.contents = new Map(e) : this.contents = e;
    for (const t of this.contents.values())
      t instanceof A && (t.parent = this);
  }
}
class M extends ie {
  fd_filestat_get() {
    return { ret: 0, filestat: new ne(this.ino, xe, BigInt(0)) };
  }
  fd_fdstat_get() {
    const e = new te(xe, 0);
    return e.fs_rights_base = BigInt(q), { ret: 0, fdstat: e };
  }
  fd_write(e) {
    return this.write(e), { ret: 0, nwritten: e.byteLength };
  }
  static lineBuffered(e) {
    const t = new TextDecoder("utf-8", { fatal: !1 });
    let o = "";
    return new M((l) => {
      o += t.decode(l, { stream: !0 });
      const n = o.split(`
`);
      for (const [r, s] of n.entries())
        r < n.length - 1 ? e(s) : o = s;
    });
  }
  constructor(e) {
    super(), this.ino = F.issue_ino(), this.write = e;
  }
}
/*!
 * Vendored from pandoc-wasm 1.1.0 (`src/core.js`), MIT License.
 * Copyright (c) Tweag I/O Limited, Johannes Wilm, and pandoc-wasm contributors.
 * See `./LICENSE-pandoc-wasm`. The WASM binary itself is Pandoc, GPL-2.0-or-later.
 *
 * 只保留 `convert` / `query` 需要的逻辑：浏览器入口（`index.browser.js`）用
 * `import('./pandoc.wasm')` 拿资源 URL，在插件的 blob URL 环境下不可用，因此这里
 * 改成由调用方提供二进制字节。
 */
async function dt(f) {
  const e = ["pandoc.wasm", "+RTS", "-H64m", "-RTS"], t = [], o = /* @__PURE__ */ new Map(), l = [
    new Oe(new P(new Uint8Array(), { readonly: !0 })),
    M.lineBuffered((u) => console.log(`[WASI stdout] ${u}`)),
    M.lineBuffered((u) => console.warn(`[WASI stderr] ${u}`)),
    new ft("/", o)
  ], n = new ct(e, t, l, { debug: !1 }), r = await WebAssembly.instantiate(f, {
    wasi_snapshot_preview1: n.wasiImport
  }), s = "instance" in r ? r.instance : r, i = s.exports;
  n.initialize(s), i.__wasm_call_ctors();
  const a = () => new DataView(i.memory.buffer), c = i.malloc(4);
  a().setUint32(c, e.length, !0);
  const d = i.malloc(4 * (e.length + 1));
  for (let u = 0; u < e.length; ++u) {
    const g = i.malloc(e[u].length + 1);
    new TextEncoder().encodeInto(
      e[u],
      new Uint8Array(i.memory.buffer, g, e[u].length)
    ), a().setUint8(g + e[u].length, 0), a().setUint32(d + 4 * u, g, !0);
  }
  a().setUint32(d + 4 * e.length, 0, !0);
  const h = i.malloc(4);
  a().setUint32(h, d, !0), i.hs_init_with_rtsopts(c, h);
  async function _(u, g, L) {
    let U;
    typeof g == "string" ? U = new TextEncoder().encode(g) : U = new Uint8Array(await g.arrayBuffer()), o.set(u, new P(U, { readonly: L }));
  }
  function m(u) {
    const g = JSON.stringify(u), L = new TextEncoder().encode(g), U = i.malloc(L.length);
    return new TextEncoder().encodeInto(
      g,
      new Uint8Array(i.memory.buffer, U, L.length)
    ), [U, L.length];
  }
  async function p(u, g, L) {
    const [U, G] = m(u), N = { ...L };
    o.clear();
    const oe = new P(new Uint8Array(), { readonly: !0 }), ae = new P(new Uint8Array(), { readonly: !1 }), ce = new P(new Uint8Array(), { readonly: !1 }), fe = new P(new Uint8Array(), { readonly: !1 });
    o.set("stdin", oe), o.set("stdout", ae), o.set("stderr", ce), o.set("warnings", fe);
    const C = /* @__PURE__ */ new Set(["stdin", "stdout", "stderr", "warnings"]);
    for (const T of Object.keys(N))
      await _(T, N[T], !0), C.add(T);
    const I = typeof u["output-file"] == "string" ? u["output-file"] : null, S = typeof u["extract-media"] == "string" ? u["extract-media"] : null;
    if (I && (await _(I, new Blob(), !1), C.add(I)), S && S.endsWith(".zip") && (await _(S, new Blob(), !1), C.add(S)), g && (oe.data = new TextEncoder().encode(g)), i.convert(U, G), I) {
      const T = o.get(I);
      T instanceof P && T.data.length > 0 && (N[I] = new Blob([T.data]));
    }
    if (S) {
      const T = o.get(S);
      T instanceof P && T.data.length > 0 && (N[S] = new Blob([T.data], {
        type: "application/zip"
      }));
    }
    const de = {}, le = (T, he) => {
      for (const [pe, B] of T.entries()) {
        const X = he ? `${he}/${pe}` : pe;
        if (B instanceof A)
          le(B.contents, X);
        else if (B instanceof P && !C.has(X) && B.data.length > 0) {
          const me = new Blob([B.data]);
          N[X] = me, de[X] = me;
        }
      }
    };
    le(o, "");
    const ue = new TextDecoder("utf-8", { fatal: !0 }).decode(
      fe.data
    );
    let _e = [];
    if (ue)
      try {
        _e = JSON.parse(ue);
      } catch (T) {
        console.warn("Failed to parse warnings:", T);
      }
    return {
      stdout: new TextDecoder("utf-8", { fatal: !0 }).decode(ae.data),
      stderr: new TextDecoder("utf-8", { fatal: !0 }).decode(ce.data),
      warnings: _e,
      files: N,
      mediaFiles: de
    };
  }
  return { convert: p };
}
let j = null;
async function lt() {
  const f = await ee("plugin_asset_path", {
    pluginId: He,
    path: "pandoc.wasm"
  }), e = await fetch(Be(f));
  if (!e.ok)
    throw new Error(`pandoc.wasm: HTTP ${e.status}`);
  return e.arrayBuffer();
}
function ut() {
  return j || (j = lt().then((f) => dt(f)).catch((f) => {
    throw j = null, f;
  })), j;
}
const _t = [
  { format: "docx", id: "docx", labelKey: "docxLabel", menuAction: "export_docx", order: 30 },
  { format: "odt", id: "odt", labelKey: "odtLabel", menuAction: "export_odt", order: 40 },
  { format: "rtf", id: "rtf", labelKey: "rtfLabel", menuAction: "export_rtf", order: 50 },
  { format: "latex", id: "latex", labelKey: "texLabel", menuAction: "export_tex", order: 60 }
];
function ht(f) {
  return {
    toc: f.settings.get("toc") ?? !1,
    numberSections: f.settings.get("numberSections") ?? !1
  };
}
async function pt(f, e, t) {
  if (!f.currentFile) throw new Error("pandoc: no document to export");
  const o = await ee("read_file", { path: f.currentFile }), { markdown: l, files: n } = await Ye(o, f.documentDir), r = await ut(), s = Ue(e), i = await r.convert(Ce(e, t), l, n), a = i.files[s];
  if (!a)
    throw new Error(i.stderr.trim() || `pandoc produced no ${e} output`);
  const c = new Uint8Array(await a.arrayBuffer());
  return {
    // LaTeX 是文本，其余是二进制（宿主按 base64 落盘）。
    data: e === "latex" ? new TextDecoder().decode(c) : c,
    suggestedName: Xe(f.currentFile, e)
  };
}
function mt(f) {
  return _t.map((e) => ({
    id: e.id,
    labelKey: e.labelKey,
    extension: Pe(e.format),
    kind: e.format === "latex" ? "text" : "binary",
    menuAction: e.menuAction,
    order: e.order,
    run: (t) => pt(t, e.format, ht(f))
  }));
}
const bt = "en-US", gt = {
  "ar-SA": {
    name: "تصدير Pandoc",
    description: "حوّل المستند الحالي إلى Word أو OpenDocument أو RTF أو LaTeX باستخدام Pandoc",
    sectionTitle: "Pandoc",
    toc: "جدول المحتويات",
    tocDesc: "إضافة جدول محتويات إلى الملف المُصدَّر",
    numberSections: "ترقيم العناوين",
    numberSectionsDesc: "ترقيم العناوين تلقائيًا في الملف المُصدَّر",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "فشل تحويل Pandoc"
  },
  "de-DE": {
    name: "Pandoc-Export",
    description: "Aktuelles Dokument mit Pandoc nach Word, OpenDocument, RTF oder LaTeX konvertieren",
    sectionTitle: "Pandoc",
    toc: "Inhaltsverzeichnis",
    tocDesc: "Der exportierten Datei ein Inhaltsverzeichnis hinzufügen",
    numberSections: "Abschnitte nummerieren",
    numberSectionsDesc: "Überschriften in der exportierten Datei automatisch nummerieren",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc-Konvertierung fehlgeschlagen"
  },
  "en-US": {
    name: "Pandoc Export",
    description: "Convert the current document to Word, OpenDocument, RTF or LaTeX with Pandoc",
    sectionTitle: "Pandoc",
    toc: "Table of contents",
    tocDesc: "Include a table of contents in the exported file",
    numberSections: "Number sections",
    numberSectionsDesc: "Number headings automatically in the exported file",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc conversion failed"
  },
  "es-ES": {
    name: "Exportar con Pandoc",
    description: "Convierte el documento actual a Word, OpenDocument, RTF o LaTeX con Pandoc",
    sectionTitle: "Pandoc",
    toc: "Tabla de contenidos",
    tocDesc: "Incluir una tabla de contenidos en el archivo exportado",
    numberSections: "Numerar secciones",
    numberSectionsDesc: "Numerar los encabezados automáticamente en el archivo exportado",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "La conversión con Pandoc ha fallado"
  },
  "fr-FR": {
    name: "Export Pandoc",
    description: "Convertir le document actuel en Word, OpenDocument, RTF ou LaTeX avec Pandoc",
    sectionTitle: "Pandoc",
    toc: "Table des matières",
    tocDesc: "Ajouter une table des matières au fichier exporté",
    numberSections: "Numéroter les sections",
    numberSectionsDesc: "Numéroter automatiquement les titres dans le fichier exporté",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "La conversion Pandoc a échoué"
  },
  "hi-IN": {
    name: "Pandoc निर्यात",
    description: "Pandoc से वर्तमान दस्तावेज़ को Word, OpenDocument, RTF या LaTeX में बदलें",
    sectionTitle: "Pandoc",
    toc: "विषय-सूची",
    tocDesc: "निर्यात की गई फ़ाइल में विषय-सूची शामिल करें",
    numberSections: "अनुभागों को क्रमांकित करें",
    numberSectionsDesc: "निर्यात की गई फ़ाइल में शीर्षकों को स्वचालित रूप से क्रमांकित करें",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc रूपांतरण विफल रहा"
  },
  "it-IT": {
    name: "Esporta con Pandoc",
    description: "Converti il documento corrente in Word, OpenDocument, RTF o LaTeX con Pandoc",
    sectionTitle: "Pandoc",
    toc: "Indice",
    tocDesc: "Includi un indice nel file esportato",
    numberSections: "Numera le sezioni",
    numberSectionsDesc: "Numera automaticamente i titoli nel file esportato",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Conversione Pandoc non riuscita"
  },
  "ja-JP": {
    name: "Pandoc エクスポート",
    description: "現在の文書を Pandoc で Word、OpenDocument、RTF、LaTeX に変換します",
    sectionTitle: "Pandoc",
    toc: "目次",
    tocDesc: "書き出したファイルに目次を含めます",
    numberSections: "セクション番号",
    numberSectionsDesc: "書き出したファイルの見出しに自動で番号を付けます",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc の変換に失敗しました"
  },
  "ko-KR": {
    name: "Pandoc 내보내기",
    description: "현재 문서를 Pandoc으로 Word, OpenDocument, RTF 또는 LaTeX로 변환합니다",
    sectionTitle: "Pandoc",
    toc: "목차",
    tocDesc: "내보낸 파일에 목차를 포함합니다",
    numberSections: "섹션 번호 매기기",
    numberSectionsDesc: "내보낸 파일의 제목에 자동으로 번호를 매깁니다",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc 변환에 실패했습니다"
  },
  "pt-PT": {
    name: "Exportar com Pandoc",
    description: "Converter o documento atual para Word, OpenDocument, RTF ou LaTeX com o Pandoc",
    sectionTitle: "Pandoc",
    toc: "Índice",
    tocDesc: "Incluir um índice no ficheiro exportado",
    numberSections: "Numerar secções",
    numberSectionsDesc: "Numerar automaticamente os títulos no ficheiro exportado",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "A conversão com Pandoc falhou"
  },
  "ru-RU": {
    name: "Экспорт через Pandoc",
    description: "Преобразовать текущий документ в Word, OpenDocument, RTF или LaTeX с помощью Pandoc",
    sectionTitle: "Pandoc",
    toc: "Оглавление",
    tocDesc: "Добавить оглавление в экспортируемый файл",
    numberSections: "Нумеровать разделы",
    numberSectionsDesc: "Автоматически нумеровать заголовки в экспортируемом файле",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Не удалось выполнить преобразование Pandoc"
  },
  "th-TH": {
    name: "ส่งออกด้วย Pandoc",
    description: "แปลงเอกสารปัจจุบันเป็น Word, OpenDocument, RTF หรือ LaTeX ด้วย Pandoc",
    sectionTitle: "Pandoc",
    toc: "สารบัญ",
    tocDesc: "ใส่สารบัญในไฟล์ที่ส่งออก",
    numberSections: "ใส่เลขหัวข้อ",
    numberSectionsDesc: "ใส่เลขหัวข้อโดยอัตโนมัติในไฟล์ที่ส่งออก",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "การแปลงด้วย Pandoc ล้มเหลว"
  },
  "vi-VN": {
    name: "Xuất bằng Pandoc",
    description: "Chuyển tài liệu hiện tại sang Word, OpenDocument, RTF hoặc LaTeX bằng Pandoc",
    sectionTitle: "Pandoc",
    toc: "Mục lục",
    tocDesc: "Thêm mục lục vào tệp xuất",
    numberSections: "Đánh số mục",
    numberSectionsDesc: "Tự động đánh số tiêu đề trong tệp xuất",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Chuyển đổi bằng Pandoc thất bại"
  },
  "zh-CN": {
    name: "Pandoc 导出",
    description: "用 Pandoc 把当前文档转换为 Word、OpenDocument、RTF 或 LaTeX",
    sectionTitle: "Pandoc",
    toc: "目录",
    tocDesc: "在导出文件中生成目录",
    numberSections: "章节编号",
    numberSectionsDesc: "自动为导出文件中的标题编号",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc 转换失败"
  },
  "zh-TW": {
    name: "Pandoc 匯出",
    description: "用 Pandoc 把目前文件轉換為 Word、OpenDocument、RTF 或 LaTeX",
    sectionTitle: "Pandoc",
    toc: "目錄",
    tocDesc: "在匯出檔案中產生目錄",
    numberSections: "章節編號",
    numberSectionsDesc: "自動為匯出檔案中的標題編號",
    docxLabel: "Word (.docx)",
    odtLabel: "OpenDocument (.odt)",
    rtfLabel: "RTF (.rtf)",
    texLabel: "LaTeX (.tex)",
    convertFailed: "Pandoc 轉換失敗"
  }
};
class Lt extends ke {
  onload() {
    this.addMessages(gt, bt);
    for (const e of mt(this.app))
      this.disposables.add(this.app.exporters.register(e));
  }
}
export {
  Lt as default
};
