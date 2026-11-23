import { Plugin as Be } from "@textox/plugin-sdk";
import { invoke as ee, convertFileSrc as ve } from "@tauri-apps/api/core";
const We = "gfm+tex_math_dollars+footnotes", Ce = {
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
  return Ce[f];
}
function Pe(f) {
  return ze[f];
}
function Xe(f, e) {
  return {
    from: We,
    to: f,
    standalone: !0,
    "output-file": Ue(f),
    ...e.toc ? { "table-of-contents": !0 } : {},
    ...e.numberSections ? { "number-sections": !0 } : {}
  };
}
function je(f, e) {
  return `${(f?.split(/[\\/]/).pop() ?? "").replace(/\.[^.]+$/, "") || "Untitled"}.${Pe(e)}`;
}
const Ae = /!\[([^\]\n]*)\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+(["'])([^"']*)\3)?\s*\)/g, Ve = {
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
function $e(f) {
  try {
    return decodeURIComponent(f);
  } catch {
    return f;
  }
}
function be(f) {
  const e = /^[\\/]/.test(f) || /^[a-zA-Z]:[\\/]/.test(f), t = [];
  for (const i of f.split(/[\\/]+/))
    if (!(!i || i === ".")) {
      if (i === "..") {
        t.pop();
        continue;
      }
      t.push(i);
    }
  return `${e ? "/" : ""}${t.join("/")}`;
}
function Re(f, e) {
  if (!e) return null;
  const t = $e(K(f));
  return /^[\\/]/.test(t) || /^[a-zA-Z]:[\\/]/.test(t) ? be(t) : be(`${e}/${t}`);
}
function Me(f) {
  const e = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(f);
  if (!e) return null;
  const t = e[1] || "application/octet-stream";
  if (e[2]) {
    const i = atob(e[3] ?? ""), l = new Uint8Array(i.length);
    for (let n = 0; n < i.length; n += 1) l[n] = i.charCodeAt(n);
    return { mime: t, bytes: l };
  }
  return { mime: t, bytes: new TextEncoder().encode(decodeURIComponent(e[3] ?? "")) };
}
function Ke(f, e) {
  const t = Ve[f.toLowerCase()];
  return t || (/\.([a-z0-9]+)(?:\?.*)?$/i.exec(K(e))?.[1]?.toLowerCase() ?? "png");
}
const Ge = (f) => ee("read_image_as_data_url", { path: f });
function Se(f, e) {
  let t = null;
  return f.split(`
`).map((i) => {
    const l = /^\s*(`{3,}|~{3,})/.exec(i)?.[1];
    return l ? (t ? (l[0] ?? "`") === t && (t = null) : t = l[0] ?? "`", i) : t ? i : e(i);
  }).join(`
`);
}
function Fe(f, e) {
  let t = "", i = 0;
  for (const l of f.matchAll(/(`+)[\s\S]*?\1/g)) {
    const n = l.index ?? 0;
    t += e(f.slice(i, n)) + l[0], i = n + l[0].length;
  }
  return t + e(f.slice(i));
}
function Ye(f, e) {
  const t = /* @__PURE__ */ new Set();
  return Se(
    f,
    (i) => Fe(i, (l) => {
      for (const n of l.matchAll(Ae)) {
        const r = n[2];
        if (!r || Ee(K(r))) continue;
        const s = Re(r, e);
        s && t.add(s);
      }
      return l;
    })
  ), [...t];
}
async function He(f, e, t = Ge) {
  const i = {}, l = /* @__PURE__ */ new Map(), n = Ye(f, e);
  for (const [s, o] of n.entries())
    try {
      const a = await t(o), c = Me(a);
      if (!c) continue;
      const d = `textox-image-${s + 1}.${Ke(c.mime, o)}`;
      l.set(o, d), i[d] = new Blob([c.bytes], { type: c.mime });
    } catch (a) {
      console.warn(`[pandoc] failed to read image ${o}:`, a);
    }
  return l.size === 0 ? { markdown: f, files: i } : { markdown: Se(
    f,
    (s) => Fe(
      s,
      (o) => o.replace(
        Ae,
        (a, c, d, _, p) => {
          if (Ee(K(d))) return a;
          const b = Re(d, e), h = b ? l.get(b) : void 0;
          if (!h) return a;
          const u = _ ? `${h} ${_}${p ?? ""}${_}` : h;
          return `![${c}](${u})`;
        }
      )
    )
  ), files: i };
}
const Je = "app.textox.pandoc", Y = 0, H = 1, y = 0, m = 8, V = 20, k = 28, ge = 31, Ze = 37, O = 44, Qe = 52, R = 54, ye = 55, w = 58, Q = 63, we = 76, q = 64;
class W {
  static read_bytes(e, t) {
    const i = new W();
    return i.buf = e.getUint32(t, !0), i.buf_len = e.getUint32(t + 4, !0), i;
  }
  static read_bytes_array(e, t, i) {
    const l = [];
    for (let n = 0; n < i; n++)
      l.push(W.read_bytes(e, t + 8 * n));
    return l;
  }
}
class C {
  static read_bytes(e, t) {
    const i = new C();
    return i.buf = e.getUint32(t, !0), i.buf_len = e.getUint32(t + 4, !0), i;
  }
  static read_bytes_array(e, t, i) {
    const l = [];
    for (let n = 0; n < i; n++)
      l.push(C.read_bytes(e, t + 8 * n));
    return l;
  }
}
const qe = 0, et = 1, Oe = 2, xe = 2, D = 3, $ = 4;
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
  write_name_bytes(e, t, i) {
    e.set(this.dir_name.slice(0, Math.min(this.dir_name.byteLength, i)), t);
  }
  constructor(e, t, i, l) {
    const n = new TextEncoder().encode(i);
    this.d_next = e, this.d_ino = t, this.d_namlen = n.byteLength, this.d_type = l, this.dir_name = n;
  }
}
const tt = 1;
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
  constructor(e, t, i) {
    this.dev = 0n, this.nlink = 0n, this.atim = 0n, this.mtim = 0n, this.ctim = 0n, this.ino = e, this.filetype = t, this.size = i;
  }
}
const nt = 0, rt = 1;
class re {
  static read_bytes(e, t) {
    return new re(e.getBigUint64(t, !0), e.getUint8(t + 8), e.getUint32(t + 16, !0), e.getBigUint64(t + 24, !0), e.getUint16(t + 36, !0));
  }
  constructor(e, t, i, l, n) {
    this.userdata = e, this.eventtype = t, this.clockid = i, this.timeout = l, this.flags = n;
  }
}
class st {
  write_bytes(e, t) {
    e.setBigUint64(t, this.userdata, !0), e.setUint16(t + 8, this.error, !0), e.setUint8(t + 10, this.eventtype);
  }
  constructor(e, t, i) {
    this.userdata = e, this.error = t, this.eventtype = i;
  }
}
const it = 0;
class ot {
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
    return t.tag = it, t.inner = new ot(e), t;
  }
  write_bytes(e, t) {
    e.setUint32(t, this.tag, !0), this.inner.write_bytes(e, t + 4);
  }
}
let at = class {
  enable(e) {
    this.log = ct(e === void 0 ? !0 : e, this.prefix);
  }
  get enabled() {
    return this.isEnabled;
  }
  constructor(e) {
    this.isEnabled = e, this.prefix = "wasi:", this.enable(e);
  }
};
function ct(f, e) {
  return f ? console.log.bind(console, "%c%s", "color: #265BA0", e) : () => {
  };
}
const x = new at(!1);
class De extends Error {
  constructor(e) {
    super("exit with exit code " + e), this.code = e;
  }
}
let ft = class {
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
  constructor(e, t, i, l = {}) {
    this.args = [], this.env = [], this.fds = [], x.enable(l.debug), this.args = e, this.env = t, this.fds = i;
    const n = this;
    this.wasiImport = { args_sizes_get(r, s) {
      const o = new DataView(n.inst.exports.memory.buffer);
      o.setUint32(r, n.args.length, !0);
      let a = 0;
      for (const c of n.args)
        a += c.length + 1;
      return o.setUint32(s, a, !0), x.log(o.getUint32(r, !0), o.getUint32(s, !0)), 0;
    }, args_get(r, s) {
      const o = new DataView(n.inst.exports.memory.buffer), a = new Uint8Array(n.inst.exports.memory.buffer), c = s;
      for (let d = 0; d < n.args.length; d++) {
        o.setUint32(r, s, !0), r += 4;
        const _ = new TextEncoder().encode(n.args[d]);
        a.set(_, s), o.setUint8(s + _.length, 0), s += _.length + 1;
      }
      return x.enabled && x.log(new TextDecoder("utf-8").decode(a.slice(c, s))), 0;
    }, environ_sizes_get(r, s) {
      const o = new DataView(n.inst.exports.memory.buffer);
      o.setUint32(r, n.env.length, !0);
      let a = 0;
      for (const c of n.env)
        a += new TextEncoder().encode(c).length + 1;
      return o.setUint32(s, a, !0), x.log(o.getUint32(r, !0), o.getUint32(s, !0)), 0;
    }, environ_get(r, s) {
      const o = new DataView(n.inst.exports.memory.buffer), a = new Uint8Array(n.inst.exports.memory.buffer), c = s;
      for (let d = 0; d < n.env.length; d++) {
        o.setUint32(r, s, !0), r += 4;
        const _ = new TextEncoder().encode(n.env[d]);
        a.set(_, s), o.setUint8(s + _.length, 0), s += _.length + 1;
      }
      return x.enabled && x.log(new TextDecoder("utf-8").decode(a.slice(c, s))), 0;
    }, clock_res_get(r, s) {
      let o;
      switch (r) {
        case H: {
          o = 5000n;
          break;
        }
        case Y: {
          o = 1000000n;
          break;
        }
        default:
          return Qe;
      }
      return new DataView(n.inst.exports.memory.buffer).setBigUint64(s, o, !0), y;
    }, clock_time_get(r, s, o) {
      const a = new DataView(n.inst.exports.memory.buffer);
      if (r === Y)
        a.setBigUint64(o, BigInt((/* @__PURE__ */ new Date()).getTime()) * 1000000n, !0);
      else if (r == H) {
        let c;
        try {
          c = BigInt(Math.round(performance.now() * 1e6));
        } catch {
          c = 0n;
        }
        a.setBigUint64(o, c, !0);
      } else
        a.setBigUint64(o, 0n, !0);
      return 0;
    }, fd_advise(r, s, o, a) {
      return n.fds[r] != null ? y : m;
    }, fd_allocate(r, s, o) {
      return n.fds[r] != null ? n.fds[r].fd_allocate(s, o) : m;
    }, fd_close(r) {
      if (n.fds[r] != null) {
        const s = n.fds[r].fd_close();
        return n.fds[r] = void 0, s;
      } else
        return m;
    }, fd_datasync(r) {
      return n.fds[r] != null ? n.fds[r].fd_sync() : m;
    }, fd_fdstat_get(r, s) {
      if (n.fds[r] != null) {
        const { ret: o, fdstat: a } = n.fds[r].fd_fdstat_get();
        return a?.write_bytes(new DataView(n.inst.exports.memory.buffer), s), o;
      } else
        return m;
    }, fd_fdstat_set_flags(r, s) {
      return n.fds[r] != null ? n.fds[r].fd_fdstat_set_flags(s) : m;
    }, fd_fdstat_set_rights(r, s, o) {
      return n.fds[r] != null ? n.fds[r].fd_fdstat_set_rights(s, o) : m;
    }, fd_filestat_get(r, s) {
      if (n.fds[r] != null) {
        const { ret: o, filestat: a } = n.fds[r].fd_filestat_get();
        return a?.write_bytes(new DataView(n.inst.exports.memory.buffer), s), o;
      } else
        return m;
    }, fd_filestat_set_size(r, s) {
      return n.fds[r] != null ? n.fds[r].fd_filestat_set_size(s) : m;
    }, fd_filestat_set_times(r, s, o, a) {
      return n.fds[r] != null ? n.fds[r].fd_filestat_set_times(s, o, a) : m;
    }, fd_pread(r, s, o, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const p = W.read_bytes_array(d, s, o);
        let b = 0;
        for (const h of p) {
          const { ret: u, data: g } = n.fds[r].fd_pread(h.buf_len, a);
          if (u != y)
            return d.setUint32(c, b, !0), u;
          if (_.set(g, h.buf), b += g.length, a += BigInt(g.length), g.length != h.buf_len)
            break;
        }
        return d.setUint32(c, b, !0), y;
      } else
        return m;
    }, fd_prestat_get(r, s) {
      const o = new DataView(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const { ret: a, prestat: c } = n.fds[r].fd_prestat_get();
        return c?.write_bytes(o, s), a;
      } else
        return m;
    }, fd_prestat_dir_name(r, s, o) {
      if (n.fds[r] != null) {
        const { ret: a, prestat: c } = n.fds[r].fd_prestat_get();
        if (c == null)
          return a;
        const d = c.inner.pr_name;
        return new Uint8Array(n.inst.exports.memory.buffer).set(d.slice(0, o), s), d.byteLength > o ? Ze : y;
      } else
        return m;
    }, fd_pwrite(r, s, o, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const p = C.read_bytes_array(d, s, o);
        let b = 0;
        for (const h of p) {
          const u = _.slice(h.buf, h.buf + h.buf_len), { ret: g, nwritten: L } = n.fds[r].fd_pwrite(u, a);
          if (g != y)
            return d.setUint32(c, b, !0), g;
          if (b += L, a += BigInt(L), L != u.byteLength)
            break;
        }
        return d.setUint32(c, b, !0), y;
      } else
        return m;
    }, fd_read(r, s, o, a) {
      const c = new DataView(n.inst.exports.memory.buffer), d = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const _ = W.read_bytes_array(c, s, o);
        let p = 0;
        for (const b of _) {
          const { ret: h, data: u } = n.fds[r].fd_read(b.buf_len);
          if (h != y)
            return c.setUint32(a, p, !0), h;
          if (d.set(u, b.buf), p += u.length, u.length != b.buf_len)
            break;
        }
        return c.setUint32(a, p, !0), y;
      } else
        return m;
    }, fd_readdir(r, s, o, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        let p = 0;
        for (; ; ) {
          const { ret: b, dirent: h } = n.fds[r].fd_readdir_single(a);
          if (b != 0)
            return d.setUint32(c, p, !0), b;
          if (h == null)
            break;
          if (o - p < h.head_length()) {
            p = o;
            break;
          }
          const u = new ArrayBuffer(h.head_length());
          if (h.write_head_bytes(new DataView(u), 0), _.set(new Uint8Array(u).slice(0, Math.min(u.byteLength, o - p)), s), s += h.head_length(), p += h.head_length(), o - p < h.name_length()) {
            p = o;
            break;
          }
          h.write_name_bytes(_, s, o - p), s += h.name_length(), p += h.name_length(), a = h.d_next;
        }
        return d.setUint32(c, p, !0), 0;
      } else
        return m;
    }, fd_renumber(r, s) {
      if (n.fds[r] != null && n.fds[s] != null) {
        const o = n.fds[s].fd_close();
        return o != 0 ? o : (n.fds[s] = n.fds[r], n.fds[r] = void 0, 0);
      } else
        return m;
    }, fd_seek(r, s, o, a) {
      const c = new DataView(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const { ret: d, offset: _ } = n.fds[r].fd_seek(s, o);
        return c.setBigInt64(a, _, !0), d;
      } else
        return m;
    }, fd_sync(r) {
      return n.fds[r] != null ? n.fds[r].fd_sync() : m;
    }, fd_tell(r, s) {
      const o = new DataView(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const { ret: a, offset: c } = n.fds[r].fd_tell();
        return o.setBigUint64(s, c, !0), a;
      } else
        return m;
    }, fd_write(r, s, o, a) {
      const c = new DataView(n.inst.exports.memory.buffer), d = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const _ = C.read_bytes_array(c, s, o);
        let p = 0;
        for (const b of _) {
          const h = d.slice(b.buf, b.buf + b.buf_len), { ret: u, nwritten: g } = n.fds[r].fd_write(h);
          if (u != y)
            return c.setUint32(a, p, !0), u;
          if (p += g, g != h.byteLength)
            break;
        }
        return c.setUint32(a, p, !0), y;
      } else
        return m;
    }, path_create_directory(r, s, o) {
      const a = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const c = new TextDecoder("utf-8").decode(a.slice(s, s + o));
        return n.fds[r].path_create_directory(c);
      } else
        return m;
    }, path_filestat_get(r, s, o, a, c) {
      const d = new DataView(n.inst.exports.memory.buffer), _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const p = new TextDecoder("utf-8").decode(_.slice(o, o + a)), { ret: b, filestat: h } = n.fds[r].path_filestat_get(s, p);
        return h?.write_bytes(d, c), b;
      } else
        return m;
    }, path_filestat_set_times(r, s, o, a, c, d, _) {
      const p = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const b = new TextDecoder("utf-8").decode(p.slice(o, o + a));
        return n.fds[r].path_filestat_set_times(s, b, c, d, _);
      } else
        return m;
    }, path_link(r, s, o, a, c, d, _) {
      const p = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null && n.fds[c] != null) {
        const b = new TextDecoder("utf-8").decode(p.slice(o, o + a)), h = new TextDecoder("utf-8").decode(p.slice(d, d + _)), { ret: u, inode_obj: g } = n.fds[r].path_lookup(b, s);
        return g == null ? u : n.fds[c].path_link(h, g, !1);
      } else
        return m;
    }, path_open(r, s, o, a, c, d, _, p, b) {
      const h = new DataView(n.inst.exports.memory.buffer), u = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const g = new TextDecoder("utf-8").decode(u.slice(o, o + a));
        x.log(g);
        const { ret: L, fd_obj: U } = n.fds[r].path_open(s, g, c, d, _, p);
        if (L != 0)
          return L;
        n.fds.push(U);
        const G = n.fds.length - 1;
        return h.setUint32(b, G, !0), 0;
      } else
        return m;
    }, path_readlink(r, s, o, a, c, d) {
      const _ = new DataView(n.inst.exports.memory.buffer), p = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const b = new TextDecoder("utf-8").decode(p.slice(s, s + o));
        x.log(b);
        const { ret: h, data: u } = n.fds[r].path_readlink(b);
        if (u != null) {
          const g = new TextEncoder().encode(u);
          if (g.length > c)
            return _.setUint32(d, 0, !0), m;
          p.set(g, a), _.setUint32(d, g.length, !0);
        }
        return h;
      } else
        return m;
    }, path_remove_directory(r, s, o) {
      const a = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const c = new TextDecoder("utf-8").decode(a.slice(s, s + o));
        return n.fds[r].path_remove_directory(c);
      } else
        return m;
    }, path_rename(r, s, o, a, c, d) {
      const _ = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null && n.fds[a] != null) {
        const p = new TextDecoder("utf-8").decode(_.slice(s, s + o)), b = new TextDecoder("utf-8").decode(_.slice(c, c + d));
        let { ret: h, inode_obj: u } = n.fds[r].path_unlink(p);
        if (u == null)
          return h;
        if (h = n.fds[a].path_link(b, u, !0), h != y && n.fds[r].path_link(p, u, !0) != y)
          throw "path_link should always return success when relinking an inode back to the original place";
        return h;
      } else
        return m;
    }, path_symlink(r, s, o, a, c) {
      const d = new Uint8Array(n.inst.exports.memory.buffer);
      return n.fds[o] != null ? (new TextDecoder("utf-8").decode(d.slice(r, r + s)), new TextDecoder("utf-8").decode(d.slice(a, a + c)), w) : m;
    }, path_unlink_file(r, s, o) {
      const a = new Uint8Array(n.inst.exports.memory.buffer);
      if (n.fds[r] != null) {
        const c = new TextDecoder("utf-8").decode(a.slice(s, s + o));
        return n.fds[r].path_unlink_file(c);
      } else
        return m;
    }, poll_oneoff(r, s, o) {
      if (o === 0)
        return k;
      if (o > 1)
        return x.log("poll_oneoff: only a single subscription is supported"), w;
      const a = new DataView(n.inst.exports.memory.buffer), c = re.read_bytes(a, r), d = c.eventtype, _ = c.clockid, p = c.timeout;
      if (d !== nt)
        return x.log("poll_oneoff: only clock subscriptions are supported"), w;
      let b;
      if (_ === H)
        b = () => BigInt(Math.round(performance.now() * 1e6));
      else if (_ === Y)
        b = () => BigInt((/* @__PURE__ */ new Date()).getTime()) * 1000000n;
      else
        return k;
      const h = (c.flags & rt) !== 0 ? p : b() + p;
      for (; h > b(); )
        ;
      return new st(c.userdata, y, d).write_bytes(a, s), y;
    }, proc_exit(r) {
      throw new De(r);
    }, proc_raise(r) {
      throw "raised signal " + r;
    }, sched_yield() {
    }, random_get(r, s) {
      const o = new Uint8Array(n.inst.exports.memory.buffer).subarray(r, r + s);
      if ("crypto" in globalThis && (typeof SharedArrayBuffer > "u" || !(n.inst.exports.memory.buffer instanceof SharedArrayBuffer)))
        for (let a = 0; a < s; a += 65536)
          crypto.getRandomValues(o.subarray(a, a + 65536));
      else
        for (let a = 0; a < s; a++)
          o[a] = Math.random() * 256 | 0;
    }, sock_recv(r, s, o) {
      throw "sockets not supported";
    }, sock_send(r, s, o) {
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
  fd_filestat_set_times(e, t, i) {
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
  path_filestat_set_times(e, t, i, l, n) {
    return w;
  }
  path_link(e, t, i) {
    return w;
  }
  path_unlink(e) {
    return { ret: w, inode_obj: null };
  }
  path_lookup(e, t) {
    return { ret: w, inode_obj: null };
  }
  path_open(e, t, i, l, n, r) {
    return { ret: R, fd_obj: null };
  }
  path_readlink(e) {
    return { ret: w, data: null };
  }
  path_remove_directory(e) {
    return w;
  }
  path_rename(e, t, i) {
    return w;
  }
  path_unlink_file(e) {
    return w;
  }
}
class S {
  static issue_ino() {
    return S.next_ino++;
  }
  static root_ino() {
    return 0n;
  }
  constructor() {
    this.ino = S.issue_ino();
  }
}
S.next_ino = 1n;
class Ne extends ie {
  fd_allocate(e, t) {
    if (!(this.file.size > e + t)) {
      const i = new Uint8Array(Number(e + t));
      i.set(this.file.data, 0), this.file.data = i;
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
    let i;
    switch (t) {
      case qe:
        i = e;
        break;
      case et:
        i = this.file_pos + e;
        break;
      case Oe:
        i = BigInt(this.file.data.byteLength) + e;
        break;
      default:
        return { ret: k, offset: 0n };
    }
    return i < 0 ? { ret: k, offset: 0n } : (this.file_pos = i, { ret: 0, offset: this.file_pos });
  }
  fd_tell() {
    return { ret: 0, offset: this.file_pos };
  }
  fd_write(e) {
    if (this.file.readonly) return { ret: m, nwritten: 0 };
    if (this.file_pos + BigInt(e.byteLength) > this.file.size) {
      const t = this.file.data;
      this.file.data = new Uint8Array(Number(this.file_pos + BigInt(e.byteLength))), this.file.data.set(t);
    }
    return this.file.data.set(e, Number(this.file_pos)), this.file_pos += BigInt(e.byteLength), { ret: 0, nwritten: e.byteLength };
  }
  fd_pwrite(e, t) {
    if (this.file.readonly) return { ret: m, nwritten: 0 };
    if (t + BigInt(e.byteLength) > this.file.size) {
      const i = this.file.data;
      this.file.data = new Uint8Array(Number(t + BigInt(e.byteLength))), this.file.data.set(i);
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
class Ie extends ie {
  fd_seek(e, t) {
    return { ret: m, offset: 0n };
  }
  fd_tell() {
    return { ret: m, offset: 0n };
  }
  fd_allocate(e, t) {
    return m;
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
    const [t, i] = Array.from(this.dir.contents.entries())[Number(e - 2n)];
    return { ret: 0, dirent: new J(e + 1n, i.ino, t, i.stat().filetype) };
  }
  path_filestat_get(e, t) {
    const { ret: i, path: l } = E.from(t);
    if (l == null)
      return { ret: i, filestat: null };
    const { ret: n, entry: r } = this.dir.get_entry_for_path(l);
    return r == null ? { ret: n, filestat: null } : { ret: 0, filestat: r.stat() };
  }
  path_lookup(e, t) {
    const { ret: i, path: l } = E.from(e);
    if (l == null)
      return { ret: i, inode_obj: null };
    const { ret: n, entry: r } = this.dir.get_entry_for_path(l);
    return r == null ? { ret: n, inode_obj: null } : { ret: y, inode_obj: r };
  }
  path_open(e, t, i, l, n, r) {
    const { ret: s, path: o } = E.from(t);
    if (o == null)
      return { ret: s, fd_obj: null };
    let { ret: a, entry: c } = this.dir.get_entry_for_path(o);
    if (c == null) {
      if (a != O)
        return { ret: a, fd_obj: null };
      if ((i & Z) == Z) {
        const { ret: d, entry: _ } = this.dir.create_entry_for_path(t, (i & v) == v);
        if (_ == null)
          return { ret: d, fd_obj: null };
        c = _;
      } else
        return { ret: O, fd_obj: null };
    } else if ((i & Te) == Te)
      return { ret: V, fd_obj: null };
    return (i & v) == v && c.stat().filetype !== D ? { ret: R, fd_obj: null } : c.path_open(i, l, r);
  }
  path_create_directory(e) {
    return this.path_open(0, e, Z | v, 0n, 0n, 0).ret;
  }
  path_link(e, t, i) {
    const { ret: l, path: n } = E.from(e);
    if (n == null)
      return l;
    if (n.is_dir)
      return O;
    const { ret: r, parent_entry: s, filename: o, entry: a } = this.dir.get_parent_dir_and_entry_for_path(n, !0);
    if (s == null || o == null)
      return r;
    if (a != null) {
      const c = t.stat().filetype == D, d = a.stat().filetype == D;
      if (c && d)
        if (i && a instanceof A) {
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
    return !i && t.stat().filetype == D ? Q : (s.contents.set(o, t), y);
  }
  path_unlink(e) {
    const { ret: t, path: i } = E.from(e);
    if (i == null)
      return { ret: t, inode_obj: null };
    const { ret: l, parent_entry: n, filename: r, entry: s } = this.dir.get_parent_dir_and_entry_for_path(i, !0);
    return n == null || r == null ? { ret: l, inode_obj: null } : s == null ? { ret: O, inode_obj: null } : (n.contents.delete(r), { ret: y, inode_obj: s });
  }
  path_unlink_file(e) {
    const { ret: t, path: i } = E.from(e);
    if (i == null)
      return t;
    const { ret: l, parent_entry: n, filename: r, entry: s } = this.dir.get_parent_dir_and_entry_for_path(i, !1);
    return n == null || r == null || s == null ? l : s.stat().filetype === D ? ge : (n.contents.delete(r), y);
  }
  path_remove_directory(e) {
    const { ret: t, path: i } = E.from(e);
    if (i == null)
      return t;
    const { ret: l, parent_entry: n, filename: r, entry: s } = this.dir.get_parent_dir_and_entry_for_path(i, !1);
    return n == null || r == null || s == null ? l : !(s instanceof A) || s.stat().filetype !== D ? R : s.contents.size !== 0 ? ye : n.contents.delete(r) ? y : O;
  }
  fd_filestat_get() {
    return { ret: 0, filestat: this.dir.stat() };
  }
  fd_filestat_set_size(e) {
    return m;
  }
  fd_read(e) {
    return { ret: m, data: new Uint8Array() };
  }
  fd_pread(e, t) {
    return { ret: m, data: new Uint8Array() };
  }
  fd_write(e) {
    return { ret: m, nwritten: 0 };
  }
  fd_pwrite(e, t) {
    return { ret: m, nwritten: 0 };
  }
  constructor(e) {
    super(), this.dir = e;
  }
}
class lt extends Ie {
  fd_prestat_get() {
    return { ret: 0, prestat: se.dir(this.prestat_name) };
  }
  constructor(e, t) {
    super(new A(t)), this.prestat_name = e;
  }
}
class P extends S {
  path_open(e, t, i) {
    if (this.readonly && (t & BigInt(q)) == BigInt(q))
      return { ret: Q, fd_obj: null };
    if ((e & Le) == Le) {
      if (this.readonly) return { ret: Q, fd_obj: null };
      this.data = new Uint8Array([]);
    }
    const l = new Ne(this);
    return i & tt && l.fd_seek(0n, Oe), { ret: y, fd_obj: l };
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
let E = class ke {
  static from(e) {
    const t = new ke();
    if (t.is_dir = e.endsWith("/"), e.startsWith("/"))
      return { ret: we, path: null };
    if (e.includes("\0"))
      return { ret: k, path: null };
    for (const i of e.split("/"))
      if (!(i === "" || i === ".")) {
        if (i === "..") {
          if (t.parts.pop() == null)
            return { ret: we, path: null };
          continue;
        }
        t.parts.push(i);
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
class A extends S {
  parent_ino() {
    return this.parent == null ? S.root_ino() : this.parent.ino;
  }
  path_open(e, t, i) {
    return { ret: y, fd_obj: new Ie(this) };
  }
  stat() {
    return new ne(this.ino, D, 0n);
  }
  get_entry_for_path(e) {
    let t = this;
    for (const i of e.parts) {
      if (!(t instanceof A))
        return { ret: R, entry: null };
      const l = t.contents.get(i);
      if (l !== void 0)
        t = l;
      else
        return x.log(i), { ret: O, entry: null };
    }
    return e.is_dir && t.stat().filetype != D ? { ret: R, entry: null } : { ret: y, entry: t };
  }
  get_parent_dir_and_entry_for_path(e, t) {
    const i = e.parts.pop();
    if (i === void 0)
      return { ret: k, parent_entry: null, filename: null, entry: null };
    const { ret: l, entry: n } = this.get_entry_for_path(e);
    if (n == null)
      return { ret: l, parent_entry: null, filename: null, entry: null };
    if (!(n instanceof A))
      return { ret: R, parent_entry: null, filename: null, entry: null };
    const r = n.contents.get(i);
    return r === void 0 ? t ? { ret: y, parent_entry: n, filename: i, entry: null } : { ret: O, parent_entry: null, filename: null, entry: null } : e.is_dir && r.stat().filetype != D ? { ret: R, parent_entry: null, filename: null, entry: null } : { ret: y, parent_entry: n, filename: i, entry: r };
  }
  create_entry_for_path(e, t) {
    const { ret: i, path: l } = E.from(e);
    if (l == null)
      return { ret: i, entry: null };
    let { ret: n, parent_entry: r, filename: s, entry: o } = this.get_parent_dir_and_entry_for_path(l, !0);
    if (r == null || s == null)
      return { ret: n, entry: null };
    if (o != null)
      return { ret: V, entry: null };
    x.log("create", l);
    let a;
    return t ? a = new A(/* @__PURE__ */ new Map()) : a = new P(new ArrayBuffer(0)), r.contents.set(s, a), o = a, { ret: y, entry: o };
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
    let i = "";
    return new M((l) => {
      i += t.decode(l, { stream: !0 });
      const n = i.split(`
`);
      for (const [r, s] of n.entries())
        r < n.length - 1 ? e(s) : i = s;
    });
  }
  constructor(e) {
    super(), this.ino = S.issue_ino(), this.write = e;
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
  const e = ["pandoc.wasm", "+RTS", "-H64m", "-RTS"], t = [], i = /* @__PURE__ */ new Map(), l = [
    new Ne(new P(new Uint8Array(), { readonly: !0 })),
    M.lineBuffered((u) => console.log(`[WASI stdout] ${u}`)),
    M.lineBuffered((u) => console.warn(`[WASI stderr] ${u}`)),
    new lt("/", i)
  ], n = new ft(e, t, l, { debug: !1 }), r = await WebAssembly.instantiate(f, {
    wasi_snapshot_preview1: n.wasiImport
  }), s = "instance" in r ? r.instance : r, o = s.exports;
  n.initialize(s), o.__wasm_call_ctors();
  const a = () => new DataView(o.memory.buffer), c = o.malloc(4);
  a().setUint32(c, e.length, !0);
  const d = o.malloc(4 * (e.length + 1));
  for (let u = 0; u < e.length; ++u) {
    const g = o.malloc(e[u].length + 1);
    new TextEncoder().encodeInto(
      e[u],
      new Uint8Array(o.memory.buffer, g, e[u].length)
    ), a().setUint8(g + e[u].length, 0), a().setUint32(d + 4 * u, g, !0);
  }
  a().setUint32(d + 4 * e.length, 0, !0);
  const _ = o.malloc(4);
  a().setUint32(_, d, !0), o.hs_init_with_rtsopts(c, _);
  async function p(u, g, L) {
    let U;
    typeof g == "string" ? U = new TextEncoder().encode(g) : U = new Uint8Array(await g.arrayBuffer()), i.set(u, new P(U, { readonly: L }));
  }
  function b(u) {
    const g = JSON.stringify(u), L = new TextEncoder().encode(g), U = o.malloc(L.length);
    return new TextEncoder().encodeInto(
      g,
      new Uint8Array(o.memory.buffer, U, L.length)
    ), [U, L.length];
  }
  async function h(u, g, L) {
    const [U, G] = b(u), N = { ...L };
    i.clear();
    const oe = new P(new Uint8Array(), { readonly: !0 }), ae = new P(new Uint8Array(), { readonly: !1 }), ce = new P(new Uint8Array(), { readonly: !1 }), fe = new P(new Uint8Array(), { readonly: !1 });
    i.set("stdin", oe), i.set("stdout", ae), i.set("stderr", ce), i.set("warnings", fe);
    const z = /* @__PURE__ */ new Set(["stdin", "stdout", "stderr", "warnings"]);
    for (const T of Object.keys(N))
      await p(T, N[T], !0), z.add(T);
    const I = typeof u["output-file"] == "string" ? u["output-file"] : null, F = typeof u["extract-media"] == "string" ? u["extract-media"] : null;
    if (I && (await p(I, new Blob(), !1), z.add(I)), F && F.endsWith(".zip") && (await p(F, new Blob(), !1), z.add(F)), g && (oe.data = new TextEncoder().encode(g)), o.convert(U, G), I) {
      const T = i.get(I);
      T instanceof P && T.data.length > 0 && (N[I] = new Blob([T.data]));
    }
    if (F) {
      const T = i.get(F);
      T instanceof P && T.data.length > 0 && (N[F] = new Blob([T.data], {
        type: "application/zip"
      }));
    }
    const le = {}, de = (T, he) => {
      for (const [pe, B] of T.entries()) {
        const X = he ? `${he}/${pe}` : pe;
        if (B instanceof A)
          de(B.contents, X);
        else if (B instanceof P && !z.has(X) && B.data.length > 0) {
          const me = new Blob([B.data]);
          N[X] = me, le[X] = me;
        }
      }
    };
    de(i, "");
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
      mediaFiles: le
    };
  }
  return { convert: h };
}
let j = null;
async function ut() {
  const f = await ee("plugin_asset_path", {
    pluginId: Je,
    path: "pandoc.wasm"
  }), e = await fetch(ve(f));
  if (!e.ok)
    throw new Error(`pandoc.wasm: HTTP ${e.status}`);
  return e.arrayBuffer();
}
function _t() {
  return j || (j = ut().then((f) => dt(f)).catch((f) => {
    throw j = null, f;
  })), j;
}
const ht = [
  { format: "docx", id: "docx", labelKey: "docxLabel", menuAction: "export_docx", order: 30 },
  { format: "odt", id: "odt", labelKey: "odtLabel", menuAction: "export_odt", order: 40 },
  { format: "rtf", id: "rtf", labelKey: "rtfLabel", menuAction: "export_rtf", order: 50 },
  { format: "latex", id: "latex", labelKey: "texLabel", menuAction: "export_tex", order: 60 }
];
function pt(f) {
  return {
    toc: f.settings.get("toc") ?? !1,
    numberSections: f.settings.get("numberSections") ?? !1
  };
}
async function mt(f, e, t) {
  if (!f.currentFile) throw new Error("pandoc: no document to export");
  const i = await ee("read_file", { path: f.currentFile }), { markdown: l, files: n } = await He(i, f.documentDir), r = await _t(), s = Ue(e), o = await r.convert(Xe(e, t), l, n), a = o.files[s];
  if (!a)
    throw new Error(o.stderr.trim() || `pandoc produced no ${e} output`);
  const c = new Uint8Array(await a.arrayBuffer());
  return {
    // LaTeX 是文本，其余是二进制（宿主按 base64 落盘）。
    data: e === "latex" ? new TextDecoder().decode(c) : c,
    suggestedName: je(f.currentFile, e)
  };
}
function bt(f) {
  return ht.map((e) => ({
    id: e.id,
    labelKey: e.labelKey,
    extension: Pe(e.format),
    kind: e.format === "latex" ? "text" : "binary",
    menuAction: e.menuAction,
    order: e.order,
    run: (t) => mt(t, e.format, pt(f))
  }));
}
const gt = "en-US", yt = {
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
class Dt extends Be {
  onload() {
    this.addMessages(yt, gt);
    for (const e of bt(this.app))
      this.disposables.add(this.app.exporters.register(e));
  }
}
export {
  Dt as default
};
