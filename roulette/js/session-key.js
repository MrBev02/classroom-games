/* =====================================================
   ROULETTE: SESSION KEY
   =====================================================

   This file contains a short code. The teacher reads the code to the
   class. The device of the student can then test the code. The device
   does not need a network connection.

   Shape:  ABCDE-FGHJK-MNPQR   (15 characters, Crockford Base32)

   75 bits, laid out as:

     bits  0-2    ver     format version
     bits  3-22   exp5    expiry, in 5-minute blocks since KEY_EPOCH
     bits 23-30   dur5    max MINUTES OF USE after first unlock, /5
     bits 31-46   mods    which modules this key opens (bit per module)
     bits 47-54   nonce   random, so two otherwise-identical keys differ
     bits 55-74   check   keyed digest of bits 0-54

   The alphabet does not contain I, L, O or U. A person can read I and L
   as 1. A person can read O as 0. The alphabet does not contain U to
   prevent an unwanted word in a code.

   The program corrects the text of the student. If a student types "l",
   the program uses "1".

   ---------------------------------------------------------------
   LIMITS OF THIS SYSTEM. Read this text before you use the system.

   The value KEY_SECRET is in a JavaScript file. Each student receives
   this file. A student can open the developer tools of the browser and
   read the value. That student can then make a valid key.

   A student can also remove the site data and set the clock to an earlier
   time. The key then does not expire.

   This system is a classroom control. It has approximately the same
   strength as an instruction to close the laptops. It prevents a mistake
   in the code and it prevents casual use after the lesson.

   This system is not a security boundary. Do not use it for a decision
   about trust or about assessment. Refer to SAFEGUARDING.md.
   ---------------------------------------------------------------

   If you change KEY_SECRET, all the existing keys become invalid. Change
   the value at the start of a year. Also change the value if a copy of
   this folder goes to a different school.
   ===================================================== */

const KEY_SECRET = "redlands-roulette-2026";
const STOP_SALT = "stop:";
const KEY_VERSION = 1;
const KEY_EPOCH = Date.UTC(2026, 0, 1);
const KEY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const KEY_LENGTH = 15;

const KEY_FIELDS = [
  { name: "ver", bits: 3 },
  { name: "exp5", bits: 20 },
  { name: "dur5", bits: 8 },
  { name: "mods", bits: 16 },
  { name: "nonce", bits: 8 },
];
const KEY_CHECK_BITS = 20;

/* ---- FNV-1a digest, with the secret before and after the data ----
   The program does not use crypto.subtle. That interface is asynchronous.
   Also, a page that opens from a file cannot always use it. The result is
   different in different browsers.

   This system must operate in the same way in three conditions: from a
   web address, from localhost, and from a USB memory device. Thus the
   program uses a short synchronous function. */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i) & 0xff;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function keyDigest(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return fnv1a(KEY_SECRET + s + KEY_SECRET);
}

/* ---- Bit operations ----
   These functions use an array of 0 values and 1 values. This method is
   slower than a shift operation. But the bitwise operators of JavaScript
   operate only on 32 bits. This format has 75 bits. Thus the program
   cannot use those operators. */
function pushBits(bits, value, width) {
  for (let i = width - 1; i >= 0; i--) bits.push((Math.floor(value / Math.pow(2, i))) % 2);
}

function readBits(bits, offset, width) {
  let v = 0;
  for (let i = 0; i < width; i++) v = v * 2 + bits[offset + i];
  return v;
}

function bitsToBytes(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = b * 2 + (bits[i + j] || 0);
    bytes.push(b);
  }
  return bytes;
}

/* ---- module mask ---- */
function moduleBit(id) {
  return MODULE_ORDER.indexOf(id);
}

function modulesToMask(ids) {
  let mask = 0;
  (ids || []).forEach((id) => {
    const b = moduleBit(id);
    if (b >= 0 && b < 16) mask += Math.pow(2, b);
  });
  return mask;
}

function maskToModules(mask) {
  return MODULE_ORDER.filter((id, i) => Math.floor(mask / Math.pow(2, i)) % 2 === 1);
}

/* ---- the public API ---- */
const RouletteKey = {
  /**
   * This function corrects the text that the student typed. It changes
   * lower case to upper case. It removes the hyphens and the spaces. It
   * also changes the three letters that look like digits.
   */
  normalise: function (str) {
    return String(str || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/[IL]/g, "1")
      .replace(/O/g, "0");
  },

  /** This function makes three groups of five characters for the display.
      The format is ABCDE-FGHJK-MNPQR. */
  format: function (raw) {
    const s = RouletteKey.normalise(raw);
    return s.replace(/(.{5})(?=.)/g, "$1-");
  },

  /**
   * @param opts.expiresAt   The time in milliseconds. After this time the
   *                         key is not valid.
   * @param opts.durationMin The permitted minutes of use after the first
   *                         unlock operation. A value of 0 gives no limit.
   * @param opts.moduleIds   The modules that this key opens.
   * @param opts.nonce       Optional. The tests use it. If you do not
   *                         supply it, the function uses a random value.
   */
  encode: function (opts) {
    const exp5 = Math.max(0, Math.min(1048575,
      Math.round((opts.expiresAt - KEY_EPOCH) / 300000)));
    const dur5 = Math.max(0, Math.min(255, Math.round((opts.durationMin || 0) / 5)));
    const values = {
      ver: KEY_VERSION,
      exp5: exp5,
      dur5: dur5,
      mods: modulesToMask(opts.moduleIds),
      nonce: opts.nonce == null ? Math.floor(Math.random() * 256) : opts.nonce & 0xff,
    };

    const payload = [];
    KEY_FIELDS.forEach((f) => pushBits(payload, values[f.name], f.bits));
    while (payload.length % 8 !== 0) payload.push(0);       // Add bits to make complete bytes.
    const check = keyDigest(bitsToBytes(payload)) % Math.pow(2, KEY_CHECK_BITS);

    const bits = [];
    KEY_FIELDS.forEach((f) => pushBits(bits, values[f.name], f.bits));
    pushBits(bits, check, KEY_CHECK_BITS);

    let out = "";
    for (let i = 0; i < bits.length; i += 5) out += KEY_ALPHABET[readBits(bits, i, 5)];
    return RouletteKey.format(out);
  },

  /**
   * @returns {ok:true, ...fields, canonical} or {ok:false, reason}
   *          The reason is "FORMAT", "CHECKSUM" or "VERSION".
   */
  decode: function (str) {
    const s = RouletteKey.normalise(str);
    if (s.length !== KEY_LENGTH) return { ok: false, reason: "FORMAT" };

    const bits = [];
    for (let i = 0; i < s.length; i++) {
      const v = KEY_ALPHABET.indexOf(s[i]);
      if (v === -1) return { ok: false, reason: "FORMAT" };
      pushBits(bits, v, 5);
    }

    const values = {};
    let offset = 0;
    KEY_FIELDS.forEach((f) => { values[f.name] = readBits(bits, offset, f.bits); offset += f.bits; });
    const check = readBits(bits, offset, KEY_CHECK_BITS);

    const payload = bits.slice(0, offset);
    while (payload.length % 8 !== 0) payload.push(0);
    if (keyDigest(bitsToBytes(payload)) % Math.pow(2, KEY_CHECK_BITS) !== check) {
      return { ok: false, reason: "CHECKSUM" };
    }
    if (values.ver !== KEY_VERSION) return { ok: false, reason: "VERSION" };

    return {
      ok: true,
      ver: values.ver,
      expiresAt: KEY_EPOCH + values.exp5 * 300000,
      durationMin: values.dur5 * 5,
      moduleIds: maskToModules(values.mods),
      nonce: values.nonce,
      canonical: s,
    };
  },

  /**
   * This function gives a code of six digits. The teacher reads this code
   * to the class. Each student types the code. The page then locks and the
   * key becomes invalid. The student cannot type the key again.
   *
   * The system does not need a network connection for this operation.
   *
   * A student who has the session key can calculate this code. That
   * student can then end only their own session. The key becomes invalid,
   * thus the student cannot start the activity again.
   */
  stopCode: function (canonical) {
    const n = fnv1a(STOP_SALT + RouletteKey.normalise(canonical) + KEY_SECRET) % 1000000;
    return String(n + 1000000).slice(1);
  },

  /** This function changes 481903 to "481-903". The teacher reads this
      format to the class. */
  formatStopCode: function (code) {
    return String(code).slice(0, 3) + "-" + String(code).slice(3);
  },
};
